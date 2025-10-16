import { StaticClientConfig } from 'nhs-notify-system-tests-shared';
import { clients } from './clients';

export const users: Record<
  string,
  { clientKey: string; clientConfig: StaticClientConfig['auth'] }
> = {
  product: {
    clientKey: 'Client1',
    clientConfig: clients['Client1'].auth,
  },
  copy: {
    clientKey: 'Client2',
    clientConfig: clients['Client2'].auth,
  },
  delete: {
    clientKey: 'Client3',
    clientConfig: clients['Client3'].auth,
  },
};
