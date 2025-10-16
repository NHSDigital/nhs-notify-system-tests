import {
  restoreSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
  deleteClientConfigs,
} from 'nhs-notify-system-tests-shared';
import z from 'zod';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);
  await stateFile.readFromDisk();

  let exit = 0;

  try {
    const initialSftpPollingFrequency = stateFile.getValue(
      'initialState',
      'sftpPollingFrequency',
      z.string()
    );

    await restoreSftpPollingFrequency(
      targetEnvrionment,
      initialSftpPollingFrequency
    );
  } catch (error) {
    exit = 1;
    console.error(error);
  }

  try {
    const clientIds = Object.values(
      stateFile.getValues('clientIds', z.record(z.string(), z.string()))
    );

    await deleteClientConfigs(targetEnvrionment, clientIds);
  } catch (error) {
    exit = 1;
    console.error(error);
  }

  process.exit(exit);
}

main();
