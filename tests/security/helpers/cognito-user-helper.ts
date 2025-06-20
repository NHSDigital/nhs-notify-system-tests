import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUserPoolsCommand
} from '@aws-sdk/client-cognito-identity-provider';

export type User = {
  email: string;
  userId: string;
};

export class CognitoUserHelper {
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  private constructor(client: CognitoIdentityProviderClient, userPoolId: string) {
    this.client = client;
    this.userPoolId = userPoolId;
  }

  static async init(poolName: string): Promise<CognitoUserHelper> {
    const client = new CognitoIdentityProviderClient({ region: 'eu-west-2' });

    let nextToken: string | undefined = undefined;

    do {
      const response = await client.send(new ListUserPoolsCommand({
        MaxResults: 60,
        NextToken: nextToken,
      }));

      const pool = response.UserPools?.find(p => p.Name === poolName);
      if (pool) return new CognitoUserHelper(client, pool.Id!);

      nextToken = response.NextToken;
    } while (nextToken);

    throw new Error(`User pool with name "${poolName}" not found`);
  }

  async createUser(username: string, password: string): Promise<User> {
    const email = `${username}@nhs.net`;

    const user = await this.client.send(
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

    await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );

    return {
      email,
      userId: user.User.Username,
    };
  }

  async deleteUser(username: string) {
    await this.client.send(
      new AdminDisableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      })
    );

    await this.client.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      })
    );
  }
}
