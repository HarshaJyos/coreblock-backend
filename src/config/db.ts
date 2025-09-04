import mongoose from "mongoose";
import { logger } from "../utils/logger";
import env from "./env";

const connectDB = async () => {
  try {
    const mongoURI = env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    await mongoose.connect(mongoURI, {
      dbName: "blog_db",
    });
    
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(`MongoDB connection error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;