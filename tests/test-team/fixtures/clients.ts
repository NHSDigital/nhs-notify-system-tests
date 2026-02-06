import type { StaticClientConfig } from 'nhs-notify-system-tests-shared';

export const clients: Record<string, StaticClientConfig> = {
  ProductPrimary: {
    templates: {
      campaignIds: ['ProductPrimary-Campaign'],
      features: {
        proofing: true,
        routing: true,
      },
    },
    auth: {
      name: 'Client 1 Product',
    },
  },
  Client2Product: {
    templates: {
      campaignIds: ['Client2Product-Campaign'],
      features: {
        proofing: true,
        routing: true,
      },
    },
    auth: {
      name: 'Client 2 Product',
    },
  },
  Client3Product: {
    templates: {
      campaignIds: ['Client3Product-Campaign'],
      features: {
        proofing: true,
        routing: true,
      },
    },
    auth: {
      name: 'Client 3 Product',
    },
  },
  RoutingDisabled: {
    templates: {
      campaignIds: ['RoutingDisabled-Campaign'],
      features: {
        proofing: true,
        routing: false,
      },
    },
    auth: {
      name: 'Routing Disabled',
    },
  },
};
