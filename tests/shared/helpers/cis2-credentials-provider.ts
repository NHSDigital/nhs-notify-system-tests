import { TOTP } from "totp-generator";

import { getSecret } from "./secret-client";

const cis2CredentialsSecretId = "test/cis2-int/credentials";

type Cis2Credentials = {
  username: string;
  password: string;
  totpSecret: string;
};

export type Cis2CredentialProvider = {
  username: string;
  password: string;
  totp: () => string;
};

export async function getCis2Credentials(): Promise<Cis2CredentialProvider> {
  const cis2Credentials = await getSecret<Cis2Credentials>(
    cis2CredentialsSecretId
  );

  return {
    username: cis2Credentials.username,
    password: cis2Credentials.password,
    totp: () =>
      TOTP.generate(cis2Credentials.totpSecret, {
        algorithm: "SHA-1",
      }).otp as string,
  };
}

type Cookie = {
  name: string;
  value: string;
};

export type BrowserState = {
  cookies: Array<Cookie>;
};

export function findCis2AccessTokens(browserState: BrowserState): Array<Cookie> {
  return browserState.cookies.filter((cookie) =>
    /^CognitoIdentityServiceProvider\..+\.accessToken$/.test(cookie.name)
  );
}
