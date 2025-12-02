declare module 'fast-glob' {
  interface Options {
    dot?: boolean;
  }
  function fg(patterns: string | string[], options?: Options): Promise<string[]>;
  export = fg;
}
