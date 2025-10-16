import {
  restoreSftpPollingFrequency,
  parseSetupTeardownArgs,
  StateFile,
  deleteClientConfigs,
  deleteClientTemplates,
} from 'nhs-notify-system-tests-shared';
import z from 'zod';
import { cis2ClientId } from '../../fixtures/clients';

async function main() {
  const { lifecycleServiceDir, targetEnvrionment, runId } =
    parseSetupTeardownArgs(process.argv);

  const stateFile = new StateFile(lifecycleServiceDir, runId);
  await stateFile.loadFromDisk();

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

  const clientIds = Object.values(
    stateFile.getValues('clientIds', z.record(z.string(), z.string()))
  );

  await deleteClientConfigs(targetEnvrionment, clientIds).catch((error) => {
    exit = 1;
    console.error(error);
  });

  const deleted = await Promise.allSettled(
    [...clientIds, cis2ClientId].map((id) =>
      deleteClientTemplates(targetEnvrionment, id)
    )
  );

  const failures = deleted.flatMap((res) =>
    res.status === 'rejected' ? [res.reason] : []
  );

  if (failures.length) {
    exit = 1;
    console.error(new AggregateError(failures));
  }

  process.exit(exit);
}

main();
