import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  ListUserPoolsCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DeleteParameterCommand,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import type { StaticClientConfig } from '../../types';
import { generate as generatePassword } from 'generate-password';
import { DeleteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const ddbDocClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: 'eu-west-2' }),
  {
    marshallOptions: { removeUndefinedValues: true },
  }
);

export type User = {
  email: string;
  password: string;
  username: string;
};

export class AuthHelper {
  private readonly userPoolId: string;

  private readonly suite: string;

  private readonly runId: string;

  private static environment: string;

  private static userTable: string;

  private readonly cognito = new CognitoIdentityProviderClient({
    region: 'eu-west-2',
  });

  private readonly ssm = new SSMClient({
    region: 'eu-west-2',
  });

  private constructor(userPoolId: string, suite: string, runId: string) {
    this.userPoolId = userPoolId;
    this.suite = suite;
    this.runId = runId;
  }

  private clientIds = new Set<string>();

  static async init(
    environment: string,
    suite: string,
    runId: string
  ): Promise<AuthHelper> {
    this.environment = environment;
    const cognito = new CognitoIdentityProviderClient({ region: 'eu-west-2' });
    const poolName = `nhs-notify-${environment}-app`;
    this.userTable = `nhs-notify-${environment}-app-users`;

    let nextToken: string | undefined = undefined;

    do {
      const response: ListUserPoolsCommandOutput = await cognito.send(
        new ListUserPoolsCommand({
          MaxResults: 60,
          NextToken: nextToken,
        })
      );

      const pool = response.UserPools?.find((p) => p.Name === poolName);
      if (pool) return new AuthHelper(pool.Id!, suite, runId);

      nextToken = response.NextToken;
    } while (nextToken);

    throw new Error(`User pool with name "${poolName}" not found`);
  }

  async createUser(
    userKey: string,
    clientKey: string,
    clientConfig: StaticClientConfig['auth']
  ): Promise<User> {
    const email = `${userKey}.${this.suite}.${this.runId}@nhs.net`;
    const clientId = `${clientKey}${this.runId}`;

    if (!this.clientIds.has(clientId)) {
      this.clientIds.add(clientId);

      await Promise.all([this.configureClient(clientId, clientConfig)]);
    }

    // Delete any existing user records just in case the tests are being re-run
    await AuthHelper.deleteUserRecords(email);

    const internalUserId = randomUUID();
    await ddbDocClient.send(
      new PutCommand({
        TableName: AuthHelper.userTable,
        Item: {
          PK: `INTERNAL_USER#${internalUserId}`,
          SK: `CLIENT#${clientId}`,
          client_id: clientId,
        },
      })
    );
    await ddbDocClient.send(
      new PutCommand({
        TableName: AuthHelper.userTable,
        Item: {
          PK: `EXTERNAL_USER#${email}`,
          SK: `INTERNAL_USER#${internalUserId}`,
        },
      })
    );

    const user = await this.cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'email_verified',
            Value: 'true',
          },
          {
            Name: 'custom:internal_user_id',
            Value: internalUserId,
          },
        ],
        MessageAction: 'SUPPRESS',
      })
    );

    if (!user?.User?.Username) {
      throw new Error('Unable to generate cognito user');
    }

    const password = generatePassword({
      length: 12,
      numbers: true,
      uppercase: true,
      symbols: true,
      strict: true,
    });

    await this.cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );

    return {
      email,
      password,
      username: user.User.Username,
    };
  }

  async deleteUser(username: string, clientKey: string) {
    const clientId = `${clientKey}${this.runId}`;

    if (!this.clientIds.has(clientId)) {
      this.clientIds.add(clientId);

      await Promise.all([this.deleteClientConfig(clientId)]);
    }

    await this.cognito.send(
      new AdminDisableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      })
    );

    await this.cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      })
    );

    await AuthHelper.deleteUserRecords(username);
  }

  private async configureClient(
    clientId: string,
    config: StaticClientConfig['auth']
  ) {
    const clientParameterPath = `/nhs-notify-${AuthHelper.environment}-app/clients/${clientId}`;

    await this.ssm.send(
      new PutParameterCommand({
        Name: clientParameterPath,
        Value: JSON.stringify({ name: config.name }),
        Type: 'String', // unencrypted, unlike the real parameters
        Tags: [{ Key: 'test-suite', Value: this.suite }],
      })
    );
  }

  private async deleteClientConfig(clientId: string) {
    const clientParameterPath = `/nhs-notify-${AuthHelper.environment}-app/clients/${clientId}`;

    await this.ssm.send(
      new DeleteParameterCommand({
        Name: clientParameterPath,
      })
    );
  }

  private static async findInternalUserIdentifiers(
    externalUserIdentifier: string
  ): Promise<string[]> {
    const input: QueryCommandInput = {
      TableName: AuthHelper.userTable,
      KeyConditionExpression: 'PK = :partitionKey',
      ExpressionAttributeValues: {
        ':partitionKey': `EXTERNAL_USER#${externalUserIdentifier}`,
      },
    };

    const result = await ddbDocClient.send(new QueryCommand(input));
    const items = result.Items ?? ([] as { PK: string; SK: string }[]);
    return items.map((item) => item.SK.replace('INTERNAL_USER#', ''));
  }

  private static async findInternalUserClientId(
    internalUserId: string
  ): Promise<string | undefined> {
    const input: QueryCommandInput = {
      TableName: AuthHelper.userTable,
      KeyConditionExpression: 'PK = :partitionKey',
      ExpressionAttributeValues: {
        ':partitionKey': `INTERNAL_USER#${internalUserId}`,
      },
    };

    const result = await ddbDocClient.send(new QueryCommand(input));
    const items = result.Items ?? ([] as { client_id: string }[]);
    return items[0]?.client_id;
  }

  private static async deleteUserRecords(
    externalUserId: string
  ): Promise<void> {
    // Query to find the internal user ID associated with the external user ID
    const internalUserIds = await this.findInternalUserIdentifiers(
      externalUserId
    );

    for (const internalUserId of internalUserIds) {
      // Delete the mapping from EXTERNAL_USER to INTERNAL_USER
      await ddbDocClient.send(
        new DeleteItemCommand({
          TableName: AuthHelper.userTable,
          Key: {
            PK: { S: `EXTERNAL_USER#${externalUserId}` },
            SK: { S: internalUserId },
          },
        })
      );

      // Retrieve the client ID associated with the internal user
      const clientId = await this.findInternalUserClientId(internalUserId);
      if (clientId) {
        // Delete the mapping from INTERNAL_USER to CLIENT
        await ddbDocClient.send(
          new DeleteItemCommand({
            TableName: AuthHelper.userTable,
            Key: {
              PK: { S: internalUserId },
              SK: { S: `CLIENT#${clientId}` },
            },
          })
        );
      }
    }
  }
}
