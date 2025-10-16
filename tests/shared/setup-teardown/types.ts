export type Phase = 'setup' | 'teardown';

export type TemplatesClientConfig = {
  id: string;
  campaignIds?: string[];
  features: {
    proofing?: boolean;
    routing?: boolean;
  };
};
