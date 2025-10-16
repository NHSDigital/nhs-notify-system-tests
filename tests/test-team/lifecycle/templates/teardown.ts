import {
  restoreSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
  deleteClientConfigs,
} from 'nhs-notify-system-tests-shared';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);
  await stateFile.readFromDisk();

  try {
    const initialSftpPollingFrequency = stateFile.getValue(
      'initialState',
      'sftpPollingFrequency'
    );

    await restoreSftpPollingFrequency(
      targetEnvrionment,
      initialSftpPollingFrequency
    );

    const clientIds = Object.values(stateFile.getValues('clients'));

    await deleteClientConfigs(targetEnvrionment, clientIds);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

main();
