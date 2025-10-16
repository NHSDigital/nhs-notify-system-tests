import type { StaticClientConfig } from 'nhs-notify-system-tests-shared';

export const clients: Record<string, StaticClientConfig> = {
  Client1: {
    templates: {
      campaignIds: ['Client-1-Product-Campaign'],
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

export const cis2ClientId = '11a686aa-3e06-46a4-8250-bd0ee61f19e1';
