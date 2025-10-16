import {
  DeleteParametersCommand,
  GetParameterCommand,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

const client = new SSMClient({ region: 'eu-west-2' });

export async function deleteParameters(names: string[]) {
  if (names.length === 0) return;
  return client.send(new DeleteParametersCommand({ Names: names }));
}

export async function getParameter(name: string) {
  return client.send(new GetParameterCommand({ Name: name }));
}

export async function putParameter(name: string, value: unknown) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);

  return client.send(
    new PutParameterCommand({ Name: name, Value: str, Type: 'String' })
  );
}
