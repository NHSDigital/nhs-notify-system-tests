import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

export type User = {
  email: string;
  userId: string;
};

export class CognitoUserHelper {
  private readonly client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: 'eu-west-2',
    });
  }

  async createUser(username: string): Promise<User> {
    const email = `${username}@nhs.net`;

    const user = await this.client.send(
      new AdminCreateUserCommand({
        UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
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
        TemporaryPassword: process.env.TEMPORARY_USER_PASSWORD,
      })
    );

    if (!user?.User?.Username) {
      throw new Error('Unable to generate cognito user');
    }

    const usesr = await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        Username: email,
        Password: process.env.USER_PASSWORD,
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
        UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        Username: username,
      })
    );

    await this.client.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        Username: username,
      })
    );
  }
}
