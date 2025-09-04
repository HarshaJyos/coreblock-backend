import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import validator from "validator";
import { redisClient } from "../config/redis";
import env from "../config/env";
import { logger } from "../utils/logger";
import CustomError from "../utils/customError";

const JWT_SECRET = env.JWT_SECRET as string;

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const ADMIN_ID = "admin"; // Fixed ID for the single admin user
const REFRESH_KEY = `refresh:${ADMIN_ID}`; // Redis key for refresh token

// Helper to generate access token
const generateAccessToken = (user: { id: string; email: string }) => {
  const options: SignOptions = {
    expiresIn: "1d",
  };
  return jwt.sign(user, JWT_SECRET, options);
};

// Helper to generate refresh token
const generateRefreshToken = () => uuidv4();

// Store refresh token in Redis with expiration
const storeRefreshToken = async (token: string) => {
  await redisClient.set(REFRESH_KEY, token, { EX: 60 * 60 * 24 * 7 }); // 7 days in seconds
};

// Login controller
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);

    // Sanitize email
    const sanitizedEmail = validator.normalizeEmail(email);
    if (!sanitizedEmail) {
      throw new CustomError("Invalid email", { statusCode: 400 });
    }

    // Check credentials
    if (sanitizedEmail !== env.ADMIN_EMAIL) {
      throw new CustomError("Invalid credentials", { statusCode: 401 });
    }

    const isMatch = await bcrypt.compare(password, env.ADMIN_HASHED_PASSWORD);
    if (!isMatch) {
      throw new CustomError("Invalid credentials", { statusCode: 401 });
    }

    // Generate tokens
    const user = { id: ADMIN_ID, email: sanitizedEmail };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store refresh token securely in Redis
    await storeRefreshToken(refreshToken);

    logger.info(`Admin logged in: ${sanitizedEmail}`);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token controller
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const { refreshToken } = refreshSchema.parse(req.body);

    // Get stored refresh token from Redis
    const storedToken = await redisClient.get(REFRESH_KEY);
    if (!storedToken || storedToken !== refreshToken) {
      throw new CustomError("Invalid refresh token", { statusCode: 401 });
    }

    // Generate new tokens
    const user = { id: ADMIN_ID, email: env.ADMIN_EMAIL };
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();

    // Update refresh token in Redis
    await storeRefreshToken(newRefreshToken);

    logger.info("Access token refreshed");

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Logout controller
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input
    const { refreshToken } = refreshSchema.parse(req.body);

    // Check if refresh token matches stored one
    const storedToken = await redisClient.get(REFRESH_KEY);
    if (storedToken && storedToken === refreshToken) {
      // Invalidate by deleting from Redis
      await redisClient.del(REFRESH_KEY);
      logger.info("Admin logged out");
    }else{
        throw new CustomError("Invalid refresh token", { statusCode: 401 });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
