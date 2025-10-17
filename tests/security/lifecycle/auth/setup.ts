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

  const authHelper = await AuthHelper.init(targetEnvrionment, 'security');

  const createdUserEntries: [string, User][] = await Promise.all(
    Object.entries(users).map(async ([userKey, config]) => {
      const createdUser = await authHelper.createUser(
        userKey,
        config.clientKey,
        runId,
        'security',
        config.clientConfig
      );

      return [userKey, createdUser];
    })
  );

  const createdUsers = Object.fromEntries(createdUserEntries);

  stateFile.setValues('users', createdUsers);

  await stateFile.persist();
}

main();
