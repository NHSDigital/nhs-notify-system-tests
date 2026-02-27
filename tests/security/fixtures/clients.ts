import type { StaticClientConfig } from 'nhs-notify-system-tests-shared';

export const clients: Record<string, StaticClientConfig> = {
  SecPrimary: {
    templates: {
      campaignIds: ['SecPrimary-Campaign'],
      features: {
        proofing: false,
      },
    },
    auth: {
      name: 'Client 1 Security',
    },
  },
  Client2Sec: {
    templates: {
      campaignIds: ['Client2Sec-Campaign'],
      features: {
        proofing: false,
      },
    },
    auth: {
      name: 'Client 2 Security',
    },
  },
  Client3Sec: {
    templates: {
      campaignIds: ['Client3Sec-Campaign'],
      features: {
        proofing: false,
      },
    },
    auth: {
      name: 'Client 3 Security',
    },
  },
  SecSpider: {
    templates: {
      campaignIds: ['SecSpider-Campaign'],
      features: {
        proofing: false,
      },
    },
    auth: {
      name: 'Client 4 Security ZAP Spider Scan',
    },
  },
  PrimaryRoutingEnabledSec: {
    templates: {
      campaignIds: ['PrimaryRoutingEnabled-Campaign'],
      features: {
        proofing: false,
        routing: true,
      },
    },
    auth: {
      name: 'Primary - Routing Enabled',
    },
  },
  CopyRoutingEnabledSec: {
    templates: {
      campaignIds: ['CopyRoutingEnabled-Campaign'],
      features: {
        proofing: false,
        routing: true,
      },
    },
    auth: {
      name: 'Copy - Routing Enabled',
    },
  },
  DeleteRoutingEnabledSec: {
    templates: {
      campaignIds: ['DeleteRoutingEnabled-Campaign'],
      features: {
        proofing: false,
        routing: true,
      },
    },
    auth: {
      name: 'Delete - Routing Enabled',
    },
  },
};
