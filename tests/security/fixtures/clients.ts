import type { StaticClientConfig } from 'nhs-notify-system-tests-shared';

export const clients: Record<string, StaticClientConfig> = {
  Client1: {
    templates: {
      campaignIds: ['Client-1-Security-Campaign'],
      features: {
        proofing: true,
      },
    },
    auth: {
      name: 'Client 1 Security',
    },
  },
  Client2: {
    templates: {
      campaignIds: ['Client-2-Security-Campaign'],
      features: {
        proofing: true,
      },
    },
    auth: {
      name: 'Client 2 Security',
    },
  },
  Client3: {
    templates: {
      campaignIds: ['Client-3-Security-Campaign'],
      features: {
        proofing: true,
      },
    },
    auth: {
      name: 'Client 3 Security',
    },
  },
  Client4: {
    templates: {
      campaignIds: ['Client-4-Security-Campaign'],
      features: {
        proofing: true,
      },
    },
    auth: {
      name: 'Client 4 Security ZAP Spider Scan',
    },
  },
};
