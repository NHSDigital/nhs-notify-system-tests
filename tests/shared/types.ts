export type StaticClientConfig = {
  templates: {
    campaignIds?: string[];
    features?: { proofing?: boolean; routing?: boolean };
  };
  auth: {
    name: string;
  };
};
