import type { StaticClientConfig } from 'nhs-notify-system-tests-shared';

export const clients: Record<string, StaticClientConfig> = {
  ProductPrimary: {
    templates: {
      campaignIds: ['ProductPrimary-Campaign'],
      features: {
        proofing: true,
      },
    },
    auth: {
      name: 'Client 1 Product',
    },
  },
  Client2: {
    templates: {
      campaignIds: ['Client-2-Product-Campaign'],
      features: {
        proofing: true,
      },
    },
    auth: {
      name: 'Client 2 Product',
    },
  },
  Client3: {
    templates: {
      campaignIds: ['Client-3-Product-Campaign'],
      features: {
        proofing: true,
      },
    },
    auth: {
      name: 'Client 3 Product',
    },
  },
};
