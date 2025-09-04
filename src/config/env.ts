import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("15m"), // Short-lived access token
  REFRESH_EXPIRES_IN: z.string().default("7d"), // Long-lived refresh token
  ADMIN_EMAIL: z.string().email().min(1, "ADMIN_EMAIL is required"),
  ADMIN_HASHED_PASSWORD: z.string().min(1, "ADMIN_HASHED_PASSWORD is required"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
});

const env = envSchema.parse(process.env);

export default env;