import fs from "fs";
import { CognitoUserHelper } from "../helpers/cognito-user-helper";
import { BrowserState, findCis2AccessTokens } from "../helpers/cis2-credentials-provider";

function extractCis2Subject(): string {

  const browserStateData = fs.readFileSync("cis2.json", "utf-8");
  const browserState = JSON.parse(browserStateData) as BrowserState;
  const accessTokenCookies = findCis2AccessTokens(browserState)
  console.log(`Found ${accessTokenCookies.length} access token cookies of ${browserState.cookies.length} cookies`);
  
  return accessTokenCookies
    .map((cookie) => cookie.value)
    .map((token) => token.split(".")[1])
    .map((jwtPayload) => Buffer.from(jwtPayload, "base64").toString())
    .map((jwtBody) => JSON.parse(jwtBody).sub)
    .filter((sub) => !!sub)
    .pop();
}

export default async function globalTeardown() {
  try {
    if (!fs.existsSync("createdUsers.json")) {
      console.log("No createdUsers.json file found, skipping teardown.");
      return;
    }

    const data = fs.readFileSync("createdUsers.json", "utf-8");
    const createdUsers = JSON.parse(data) as { userId: string }[];

    if (!createdUsers.length) {
      console.log("No users to delete.");
      return;
    }

    const cognitoHelper = await CognitoUserHelper.init(
      `nhs-notify-${process.env.TARGET_ENVIRONMENT}-app`
    );

    for (const user of createdUsers) {
      if (user?.userId) {
        try {
          await cognitoHelper.deleteUser(user.userId);
          console.log(`Deleted user ${user.userId}`);
        } catch (error) {
          console.error(`Failed to delete user ${user.userId}:`, error);
        }
      }
    }

    // Write out the user references so that we can perform the cleanup needed to keep the
    // database small and the tests running deterministically
    const cis2Subject = extractCis2Subject();
    const userSubjects = createdUsers.map((user) => user.userId);
    userSubjects.push(cis2Subject);

    const filteredUserSubjects = userSubjects.filter((sub) => !!sub);
    console.log(`Found ${filteredUserSubjects.length} users to cleanup`);
    fs.writeFileSync(
      "./test-data-cleanup.json",
      JSON.stringify(filteredUserSubjects)
    );

    // Delete storage state files and createdUsers.json
    const filesToDelete = [
      "auth.json",
      "copy.json",
      "delete.json",
      "createdUsers.json",
      "cis2.json",
    ];

    for (const file of filesToDelete) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Deleted file ${file}`);
      }
    }

    console.log("Global teardown complete.");
  } catch (error) {
    console.error("Error during globalTeardown:", error);
  }
}
