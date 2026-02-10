import type { StaticClientConfig } from 'nhs-notify-system-tests-shared';

export const clients: Record<string, StaticClientConfig> = {
  ProductPrimary: {
    templates: {
      campaignIds: ['ProductPrimary-Campaign'],
      features: {
        proofing: true,
        routing: false,
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
        routing: false,
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
        routing: false,
      },
    },
    auth: {
      name: 'Client 3 Product',
    },
  },
  PrimaryRoutingEnabledProduct: {
    templates: {
      campaignIds: ['PrimaryRoutingEnabled-Campaign'],
      features: {
        proofing: true,
        routing: true,
      },
    },
    auth: {
      name: 'Primary - Routing Enabled',
    },
  },
  CopyRoutingEnabledProduct: {
    templates: {
      campaignIds: ['CopyRoutingEnabled-Campaign'],
      features: {
        proofing: true,
        routing: true,
      },
    },
    auth: {
      name: 'Copy - Routing Enabled',
    },
  },
  DeleteRoutingEnabledProduct: {
    templates: {
      campaignIds: ['DeleteRoutingEnabled-Campaign'],
      features: {
        proofing: true,
        routing: true,
      },
    },
    auth: {
      name: 'Delete - Routing Enabled',
    },
  },
};
