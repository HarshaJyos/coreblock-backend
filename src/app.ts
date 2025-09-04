import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { xss } from "express-xss-sanitizer";
import morgan from "morgan";
import errorMiddleware from "./middlewares/errorMiddleware";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import env from "./config/env";
import { sanitizeInput } from "./middlewares/sanitizeMiddleware";

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL || "http://localhost:3000" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  })
);
app.use(sanitizeInput);
app.use(hpp());
app.use(xss()); // Replaced xss-clean with express-xss-sanitizer

// Body Parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Routes
app.use("/api/auth", authRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error Handling Middleware
app.use(errorMiddleware);

export default app;