import { StaticClientConfig } from 'nhs-notify-system-tests-shared';
import { clients } from './clients';

export const users: Record<
  string,
  { clientKey: string; clientConfig: StaticClientConfig['auth'] }
> = {
  'primary.security': {
    clientKey: 'Client1',
    clientConfig: clients['Client1'].auth,
  },
  'copy.security': {
    clientKey: 'Client2',
    clientConfig: clients['Client2'].auth,
  },
  'delete.security': {
    clientKey: 'Client3',
    clientConfig: clients['Client3'].auth,
  },
  'zap-spider.security': {
    clientKey: 'Client4',
    clientConfig: clients['Client4'].auth,
  },
};
