import type { StaticUserConfig } from 'nhs-notify-system-tests-shared';
import { clients } from './clients';

export const users: Record<string, StaticUserConfig> = {
  'primary': {
    clientKey: 'ProductPrimary',
    clientConfig: clients['ProductPrimary'].auth,
  },
  'copy': {
    clientKey: 'Client2',
    clientConfig: clients['Client2'].auth,
  },
  'delete': {
    clientKey: 'Client3',
    clientConfig: clients['Client3'].auth,
  },
};
