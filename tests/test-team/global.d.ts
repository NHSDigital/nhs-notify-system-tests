declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TARGET_ENVIRONMENT: string;
      TEMPLATE_STORAGE_TABLE_NAME: string;
    }
  }
}

export {};
