import type { Request, Response, NextFunction } from "express";
import CustomError from "../utils/customError";
import env from "../config/env";

const errorMiddleware = (
  err: any, req: Request, res: Response, next: NextFunction
) => {
if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
  } else {
    console.error(err.stack); // Log stack trace for debugging
    res.status(500).json({
      success: false,
      error: "Internal server error",
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

export default errorMiddleware;
