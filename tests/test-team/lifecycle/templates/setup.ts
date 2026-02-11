import { randomUUID } from 'node:crypto';
import {
  createClientConfig,
  increaseSftpPollingFrequency,
  type StaticClientConfig,
  parseSetupTeardownArgs,
  StateFile,
  getCis2ClientId,
  TemplateFactory,
  StorageHelper,
  TemplateType,
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

  const clientEntries = Object.entries(clients).map(
    ([key, config]) =>
      [key, { config: config.templates, id: `${key}${runId}` }] as const
  );

  await Promise.all(
    clientEntries.map(([, { id, config }]) =>
      createClientConfig(targetEnvrionment, id, config, 'product')
    )
  );

  const clientIds = Object.fromEntries(clientEntries.map(([key, { id }]) => [key, id]));

  stateFile.setValues(
    'clientIds',
    clientIds,
  );

  const cis2ClientId = await getCis2ClientId();

  stateFile.setValue('cis2', 'notify-client-id', cis2ClientId);

  const multiChannelRoutingConfigNhsAppTemplate = TemplateFactory.create(
    randomUUID(),
    clientIds['PrimaryRoutingEnabledProduct'],
    TemplateType.NHS_APP,
    {
      name: 'multi-channel-routing-config-nhsapp-template-name',
      message: 'multi-channel-routing-config-nhsapp-message',
    }
  );
  stateFile.setValue('templates', 'multiChannelRoutingConfigNhsApp', multiChannelRoutingConfigNhsAppTemplate);

  const multiChannelRoutingConfigEmailTemplate = TemplateFactory.create(
    randomUUID(),
    clientIds['PrimaryRoutingEnabledProduct'],
    TemplateType.EMAIL,
    {
      name: 'multi-channel-routing-config-email-template-name',
      message: 'multi-channel-routing-config-email-template-message',
      subject: 'multi-channel-routing-config-email-template-subject',
    }
  );
  stateFile.setValue('templates', 'multiChannelRoutingConfigEmail', multiChannelRoutingConfigEmailTemplate);

  const multiChannelRoutingConfigSmsTemplate = TemplateFactory.create(
    randomUUID(),
    clientIds['PrimaryRoutingEnabledProduct'],
    TemplateType.SMS,
    {
      name: 'multi-channel-routing-config-sms-template-name',
      message: 'multi-channel-routing-config-sms-template-message',
    }
  );
  stateFile.setValue('templates', 'multiChannelRoutingConfigSms', multiChannelRoutingConfigSmsTemplate);

  await new StorageHelper(`nhs-notify-${targetEnvrionment}-app-api-templates`, [
    multiChannelRoutingConfigNhsAppTemplate,
    multiChannelRoutingConfigEmailTemplate,
    multiChannelRoutingConfigSmsTemplate,
  ]).seedData();

  await stateFile.persist();
}

main();
