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
  readonly MINIO_ENDPOINT: string;
  readonly MINIO_PORT: string;
  readonly MINIO_ACCESS_KEY: string;
  readonly MINIO_SECRET_KEY: string;
  readonly MINIO_BUCKET: string;
  readonly RABBITMQ_DEFAULT_USER: string;
  readonly RABBITMQ_DEFAULT_PASS: string;
  readonly RABBITMQ_HOST: string;
  readonly RABBITMQ_PORT: string;
  readonly RABBITMQ_QUEUE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
