import { Pool } from "pg";

const pool = new Pool({
  user: import.meta.env.DB_USER || "postgres",
  host: import.meta.env.DB_HOST || "localhost",
  database: import.meta.env.DB_NAME || "news_db",
  password: import.meta.env.DB_PASSWORD || "password",
  port: Number(import.meta.env.DB_PORT) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxLifetimeSeconds: 60,
});

export default pool;
