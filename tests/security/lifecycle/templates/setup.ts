import {
  createClientConfig,
  increaseSftpPollingFrequency,
  type StaticClientConfig,
  parseSetupTeardownArgs,
  StateFile,
  getCis2ClientId,
  TemplateFactory,
  TemplateStorageHelper,
} from 'nhs-notify-system-tests-shared';
import { clients } from '../../fixtures/clients';
import { randomUUID } from 'node:crypto';

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

  const clientIds = Object.fromEntries(
    clientEntries.map(([key, { id }]) => [key, id])
  );

  stateFile.setValues('clientIds', clientIds);

  const cis2ClientId = await getCis2ClientId();

  stateFile.setValue('cis2', 'notify-client-id', cis2ClientId);

  const smsTemplate = TemplateFactory.createSmsTemplate(
    randomUUID(),
    clientIds['Client4']
  );

  await new TemplateStorageHelper(
    `nhs-notify-${targetEnvrionment}-app-api-templates`,
    [smsTemplate]
  ).seedTemplateData();

  await stateFile.persist();
}

main();
