import { DeleteParametersCommand, SSMClient } from '@aws-sdk/client-ssm';

const client = new SSMClient({ region: 'eu-west-2' });

export async function deleteParameters(names: string[]) {
  if (names.length === 0) return;
  return client.send(new DeleteParametersCommand({ Names: names }));
}
