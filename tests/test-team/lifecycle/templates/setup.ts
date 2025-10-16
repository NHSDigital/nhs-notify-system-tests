import {
  createClientConfig,
  increaseSftpPollingFrequency,
  type StaticClientConfig,
  parseSetupTeardownArgs,
  StateFile,
} from 'nhs-notify-system-tests-shared';
import { clients } from '../../fixtures/clients';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);

  const sftpPollingFrequency = await increaseSftpPollingFrequency(
    targetEnvrionment
  );

  stateFile.setValue(
    'initialState',
    'sftpPollingFrequency',
    sftpPollingFrequency
  );

  const clientEntries: [
    string,
    { config: StaticClientConfig['templates']; id: string }
  ][] = Object.entries(clients).map(([key, config]) => [
    key,
    { config: config.templates, id: `${key}${runId}` },
  ]);

  await Promise.all(
    clientEntries.map(([, { id, config }]) =>
      createClientConfig(targetEnvrionment, id, config)
    )
  );

  stateFile.setValues(
    'clientIds',
    Object.fromEntries(clientEntries.map(([key, { id }]) => [key, id]))
  );

  await stateFile.persist();
}

main();
