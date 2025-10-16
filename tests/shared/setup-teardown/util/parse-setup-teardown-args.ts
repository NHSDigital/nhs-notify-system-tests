import { basename } from 'node:path';

export function parseSetupTeardownArgs(argv: string[]) {
  const [, scriptPath, targetEnvrionment, runId] = argv;

  const lifecycleServiceDir = basename(scriptPath);

  if (typeof lifecycleServiceDir !== 'string') {
    throw new Error('Unable to determine script path');
  }

  if (typeof targetEnvrionment !== 'string') {
    throw new Error('Unable to determine target environment');
  }

  if (typeof targetEnvrionment !== 'string') {
    throw new Error('Unable to determine run ID');
  }

  return { lifecycleServiceDir, targetEnvrionment, runId };
}
