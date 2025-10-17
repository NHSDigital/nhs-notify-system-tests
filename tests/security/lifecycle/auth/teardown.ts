import {
  AuthHelper,
  parseSetupTeardownArgs,
  StateFile,
} from 'nhs-notify-system-tests-shared';
import z from 'zod';
import { users } from '../../fixtures/users';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);
  await stateFile.loadFromDisk();

  const authHelper = await AuthHelper.init(targetEnvrionment, 'security');

  const usersState = stateFile.getValues(
    'users',
    z.record(z.string(), z.object({ username: z.string() }))
  );

  await Promise.all(
    Object.entries(usersState).map(([key, userState]) =>
      authHelper.deleteUser(
        userState.username,
        `${users[key].clientKey}${runId}`
      )
    )
  );
}

main();
