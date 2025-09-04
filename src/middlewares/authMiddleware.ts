import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";
import { AuthRequest } from "../types";
import CustomError from "../utils/customError";

// Protect middleware for authenticated routes
export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new CustomError("Not authorized, no token", { statusCode: 401 }));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; username: string };

    // Attach user to request
    req.user = {
      id: decoded.id,
      username: decoded.username
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Token expired", { statusCode: 401 }));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError("Invalid token", { statusCode: 401 }));
    } else {
      return next(new CustomError("Not authorized", { statusCode: 401 }));
    }
  }
};