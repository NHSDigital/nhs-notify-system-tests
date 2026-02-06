import type { StaticUserConfig } from 'nhs-notify-system-tests-shared';
import { clients } from './clients';

export const users: Record<string, StaticUserConfig> = {
  primary: {
    clientKey: 'ProductPrimary',
    clientConfig: clients['ProductPrimary'].auth,
  },
  copy: {
    clientKey: 'Client2Product',
    clientConfig: clients['Client2Product'].auth,
  },
  delete: {
    clientKey: 'Client3Product',
    clientConfig: clients['Client3Product'].auth,
  },
  primaryRoutingEnabled: {
    clientKey: 'PrimaryRoutingEnabled',
    clientConfig: clients['PrimaryRoutingEnabled'].auth,
  },
  copyRoutingEnabled: {
    clientKey: 'CopyRoutingEnabled',
    clientConfig: clients['CopyRoutingEnabled'].auth,
  },
  deleteRoutingEnabled: {
    clientKey: 'DeleteRoutingEnabled',
    clientConfig: clients['DeleteRoutingEnabled'].auth,
  },
};
