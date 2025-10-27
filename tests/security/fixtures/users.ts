import type { StaticUserConfig } from 'nhs-notify-system-tests-shared';
import { clients } from './clients';

export const users: Record<string, StaticUserConfig> = {
  primary: {
    clientKey: 'SecPrimary',
    clientConfig: clients['SecPrimary'].auth,
  },
  copy: {
    clientKey: 'Client2Sec',
    clientConfig: clients['Client2Sec'].auth,
  },
  delete: {
    clientKey: 'Client3Sec',
    clientConfig: clients['Client3Sec'].auth,
  },
  'zap-spider': {
    clientKey: 'SecSpider',
    clientConfig: clients['SecSpider'].auth,
  },
};
