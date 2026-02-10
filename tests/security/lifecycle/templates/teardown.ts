import {
  restoreSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
  deleteClientConfigs,
  deleteClientEntries,
} from 'nhs-notify-system-tests-shared';
import z from 'zod';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);
  await stateFile.loadFromDisk();

  let exit = 0;

  const initialSftpPollingFrequency = stateFile.getValue(
    'initialState',
    'sftpPollingFrequency',
    z.string().default('')
  );

  await restoreSftpPollingFrequency(
    targetEnvrionment,
    initialSftpPollingFrequency
  ).catch((error) => {
    exit = 1;
    console.error(error);
  });

  const clientIds = Object.values(
    stateFile.getValues(
      'clientIds',
      z.record(z.string(), z.string()).default({})
    )
  );

  await deleteClientConfigs(targetEnvrionment, clientIds).catch((error) => {
    exit = 1;
    console.error(error);
  });

  const cis2ClientId = stateFile.getValue(
    'cis2',
    'notify-client-id',
    z.string().default('')
  );

  const deletedTemplates = await Promise.allSettled(
    [...clientIds, cis2ClientId].map((id) =>
      deleteClientEntries(id, `nhs-notify-${targetEnvrionment}-app-api-templates`)
    )
  );

  const deletedRoutingConfigs = await Promise.allSettled(
    [...clientIds, cis2ClientId].map((id) =>
      deleteClientEntries(id, `nhs-notify-${targetEnvrionment}-app-api-routing-configuration`)
    )
  );

  const failures = [...deletedTemplates, ...deletedRoutingConfigs].flatMap((res) =>
    res.status === 'rejected' ? [res.reason] : []
  );

  if (failures.length) {
    exit = 1;
    console.error(new AggregateError(failures));
  }

  process.exit(exit);
}

main();
