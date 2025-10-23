import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  CreateGroupCommand,
  DeleteGroupCommand,
  ListUserPoolsCommand,
  ListUserPoolsCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DeleteParameterCommand,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

export type User = {
  email: string;
  userId: string;
  clientId: string;
};

export type TestClientConfig = {
  id: string;
  name: string;
  campaignIds?: string[];
  features: {
    proofing: boolean;
  };
};

export class CognitoUserHelper {
  private readonly userPoolId: string;

  private static environment: string;

  private readonly cognito = new CognitoIdentityProviderClient({
    region: 'eu-west-2',
  });

  private readonly ssm = new SSMClient({
    region: 'eu-west-2',
  });

  private constructor(userPoolId: string) {
    this.userPoolId = userPoolId;
  }

  private clientIds = new Set<string>();

  static async init(environment: string): Promise<CognitoUserHelper> {
    this.environment = environment;
    const cognito = new CognitoIdentityProviderClient({ region: 'eu-west-2' });
    const poolName = `nhs-notify-${environment}-app`;

    let nextToken: string | undefined = undefined;

    do {
      const response: ListUserPoolsCommandOutput = await cognito.send(
        new ListUserPoolsCommand({
          MaxResults: 60,
          NextToken: nextToken,
        })
      );

      const pool = response.UserPools?.find((p) => p.Name === poolName);
      if (pool) return new CognitoUserHelper(pool.Id!);

      nextToken = response.NextToken;
    } while (nextToken);

    throw new Error(`User pool with name "${poolName}" not found`);
  }

  async createUser(
    username: string,
    password: string,
    client: TestClientConfig
  ): Promise<User> {
    const email = `${username}@nhs.net`;

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
        ],
        MessageAction: 'SUPPRESS',
      })
    );

    if (!user?.User?.Username) {
      throw new Error('Unable to generate cognito user');
    }

    await this.cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );

    if (!this.clientIds.has(client.id)) {
      this.clientIds.add(client.id);

      await Promise.all([
        this.configureClient(client),
        this.createClientGroup(client.id),
      ]);
    }

    await this.addUserToClientGroup(email, client.id);

    return {
      clientId: client.id,
      email,
      userId: user.User.Username,
    };
  }

  async deleteUser(username: string, clientId: string) {
    if (!this.clientIds.has(clientId)) {
      this.clientIds.add(clientId);

      await Promise.all([
        this.deleteClientConfig(clientId),
        this.deleteClientGroup(clientId),
      ]);
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
  }

  private async createClientGroup(clientId: string) {
    await this.cognito.send(
      new CreateGroupCommand({
        GroupName: `client:${clientId}`,
        UserPoolId: this.userPoolId,
        Description: 'Playwright'
      })
    );
  }

  private async deleteClientGroup(clientId: string) {
    await this.cognito.send(
      new DeleteGroupCommand({
        GroupName: `client:${clientId}`,
        UserPoolId: this.userPoolId,
      })
    );
  }

  private async addUserToClientGroup(username: string, clientId: string) {
    await this.cognito.send(
      new AdminAddUserToGroupCommand({
        GroupName: `client:${clientId}`,
        Username: username,
        UserPoolId: this.userPoolId,
      })
    );
  }

  private async configureClient(client: TestClientConfig) {
    const clientParameterPath = `/nhs-notify-${CognitoUserHelper.environment}-app/clients/${client.id}`;

    await this.ssm.send(
      new PutParameterCommand({
        Name: clientParameterPath,
        Value: JSON.stringify({ name: client.name }),
        Type: 'String', // unencrypted, unlike the real parameters
        Overwrite: true,
      })
    );
  }

  private async deleteClientConfig(clientId: string) {
    const clientParameterPath = `/nhs-notify-${CognitoUserHelper.environment}-app/clients/${clientId}`;

    await this.ssm.send(
      new DeleteParameterCommand({
        Name: clientParameterPath,
      })
    );
  }
}
