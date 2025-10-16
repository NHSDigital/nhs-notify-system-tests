import { dirname } from 'node:path';
import z from 'zod';

export function parseSetupTeardownArgs(argv: string[]): {
  lifecycleServiceDir: string;
  targetEnvrionment: string;
  runId: string;
} {
  const [, scriptPath, targetEnvrionment, runId] = argv;

  const lifecycleServiceDir = dirname(scriptPath);

  const parseResult = z
    .object({
      lifecycleServiceDir: z.string(),
      targetEnvrionment: z.string(),
      runId: z.string(),
    })
    .safeParse({
      lifecycleServiceDir,
      targetEnvrionment,
      runId,
    });

  if (!parseResult.success) {
    throw new Error('Unable to parse setup/teardown args', {
      cause: parseResult.error,
    });
  }

  return parseResult.data;
}
