interface ImportMetaEnv {
  readonly DB_PASSWORD: string;
  readonly DB_USER: string;
  readonly DB_HOST: string;
  readonly DB_NAME: string;
  readonly DB_PORT: string;
  readonly PORT: string;
  readonly REDIS_HOST: string;
  readonly REDIS_PORT: string;
  readonly NODE_ENV: "development" | "production";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
