import {
  AuthHelper,
  parseSetupTeardownArgs,
  StateFile,
  type User,
} from 'nhs-notify-system-tests-shared';
import { users } from '../../fixtures/users';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);

  const authHelper = await AuthHelper.init(targetEnvrionment);

  const createdUserEntries: [string, User][] = await Promise.all(
    Object.entries(users).map(async ([key, config]) => {
      const createdUser = await authHelper.createUser(
        `${key}${runId}@nhs.net`,
        `${config.clientKey}${runId}`,
        config.clientConfig
      );

      return [key, createdUser];
    })
  );

  stateFile.setValues('users', Object.fromEntries(createdUserEntries));

  await stateFile.persist();
}

main();
