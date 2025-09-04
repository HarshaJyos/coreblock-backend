import { Request, Response, NextFunction } from "express";
import { sanitize } from "express-mongo-sanitize";

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize req.body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize req.params
  if (req.params) {
    req.params = sanitize(req.params);
  }

  // Instead of modifying req.query, create a sanitized copy if needed
  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    // Use sanitizedQuery in your logic if needed, or skip modifying req.query
    // For example, you can attach it to req for later use
    (req as any).sanitizedQuery = sanitizedQuery;
  }

  next();
};