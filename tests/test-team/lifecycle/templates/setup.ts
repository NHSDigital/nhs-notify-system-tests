import {
  increaseSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
} from 'nhs-notify-system-tests-shared';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);

  const sftpPollingFrequency = await increaseSftpPollingFrequency(
    targetEnvrionment
  );

  stateFile.add('initialState', 'sftpPollingFrequency', sftpPollingFrequency);

  await stateFile.persist();
}

main();
