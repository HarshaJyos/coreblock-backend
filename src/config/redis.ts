import { createClient } from "redis";
import { logger } from "../utils/logger";
import env from "./env";

const redisClient = createClient({
  url: env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  logger.error(`Redis connection error: ${err}`);
});

redisClient.on("connect", () => {
  logger.info("Redis connected successfully");
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(`Redis connection failed: ${error}`);
    process.exit(1);
  }
};

export { redisClient, connectRedis };