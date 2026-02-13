import { TOTP } from "totp-generator";

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

function getCredentials(): Cis2Credentials {
  const rawCredentials = process.env.SYSTEM_TESTS_CIS2_INT_CREDENTIALS ?? '';
  if (!rawCredentials) {
    throw new Error("CIS2 credentials not found in environment variable SYSTEM_TESTS_CIS2_INT_CREDENTIALS");
  }
  return JSON.parse(rawCredentials) as Cis2Credentials;
}

export async function getCis2CredentialProvider(): Promise<Cis2CredentialProvider> {
  const cis2Credentials = getCredentials();

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
