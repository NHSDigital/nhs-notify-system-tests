export type Phase = 'setup' | 'teardown';

export type ClientConfig = {
  id: string;
  campaignIds?: string[];
  features: {
    proofing?: boolean;
    routing?: boolean;
  };
};
