declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PLAYWRIGHT_ZAP_PROXY: string;
      RUN_ID: string;
      TARGET_ENVIRONMENT: string;
      TEMPLATE_STORAGE_TABLE_NAME: string;
    }
  }
}

export {};
