import Redis from "ioredis";

const redis = new Redis({
  host: import.meta.env.REDIS_HOST || "localhost",
  port: parseInt(import.meta.env.REDIS_PORT) || 6379,
  db: 0,
});

export { redis };
