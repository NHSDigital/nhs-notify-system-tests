declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TEMPLATE_STORAGE_TABLE_NAME: string;
      PLAYWRIGHT_ZAP_PROXY: string;
    }
  }
}

export {};
