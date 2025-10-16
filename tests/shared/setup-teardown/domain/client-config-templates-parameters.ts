import { deleteParameters } from '../util/ssm';

export async function deleteClientConfigs(
  environment: string,
  clientIds: string[]
) {
  await deleteParameters(
    clientIds.map((id) => `nhs-notify-${environment}-app/clients/${id}`)
  );
}

export async function createClientConfig(
  environment: string,
  id: string,
  configuration: {}
) {}
