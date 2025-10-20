import {
  createClientConfig,
  increaseSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
  getCis2ClientId,
  TemplateFactory,
  StorageHelper,
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

  const clientEntries = Object.entries(clients).map(
    ([key, config]) =>
      [key, { config: config.templates, id: `${key}${runId}` }] as const
  );

  await Promise.all(
    clientEntries.map(([, { id, config }]) =>
      createClientConfig(targetEnvrionment, id, config, 'security')
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
    clientIds['SecSpider']
  );

  await new StorageHelper(`nhs-notify-${targetEnvrionment}-app-api-templates`, [
    smsTemplate,
  ]).seedData();

  await stateFile.persist();
}

main();
