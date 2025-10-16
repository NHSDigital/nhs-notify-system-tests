import { StaticClientConfig } from '../../types';
import { TemplatesClientConfig } from '../types';
import { deleteParameters, putParameter } from '../util/ssm';

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
  clientId: string,
  config: StaticClientConfig['templates']
) {
  await putParameter(`nhs-notify-${environment}-app/clients/${clientId}`, config);
}
