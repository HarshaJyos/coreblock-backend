import app from "./app";
import connectDB from "./config/db";
import { connectRedis } from "./config/redis";
import { logger } from "./utils/logger";
import env from "./config/env";

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    const PORT = parseInt(env.PORT) || 5000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error(`Server startup error: ${error}`);
    process.exit(1);
  }
};

startServer();