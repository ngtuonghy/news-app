import Redis from "ioredis";

export const redis = new Redis({
  host: import.meta.env.REDIS_HOST ||  "localhost",
  port: parseInt(import.meta.env.REDIS_PORT || "6379") || 6379,
});

let subscriber: Redis | null = null;

export function getSubscriber(): Redis {
  if (!subscriber) {
    subscriber = redis.duplicate();
    subscriber.on("error", (err) => console.error("Redis subscriber error:", err));
    subscriber.on("ready", () => console.log("Redis subscriber ready"));
    // Không gọi connect() trực tiếp, ioredis sẽ tự connect
  }
  return subscriber;
}


