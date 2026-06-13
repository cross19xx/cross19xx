interface ImportMetaEnv {
  readonly TURSO_AUTH_TOKEN: string;
  readonly TURSO_DATABASE_URL: string;

  // more env variables...
}

// biome-ignore lint/correctness/noUnusedVariables: Used because this is a .d.ts file
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
