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
import type { StaticClientConfig } from '../../types';
import { generate as generatePassword } from 'generate-password';

export type User = {
  email: string;
  password: string;
  username: string;
};

export class AuthHelper {
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

  static async init(environment: string): Promise<AuthHelper> {
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
      if (pool) return new AuthHelper(pool.Id!);

      nextToken = response.NextToken;
    } while (nextToken);

    throw new Error(`User pool with name "${poolName}" not found`);
  }

  async createUser(
    email: string,
    clientId: string,
    clientConfig: StaticClientConfig['auth']
  ): Promise<User> {
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

    if (!this.clientIds.has(clientId)) {
      this.clientIds.add(clientId);

      await Promise.all([
        this.configureClient(clientId, clientConfig),
        this.createClientGroup(clientId),
      ]);
    }

    await this.addUserToClientGroup(email, clientId);

    return {
      email,
      password,
      username: user.User.Username,
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
        Description: 'Playwright',
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
        Overwrite: true,
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
}
