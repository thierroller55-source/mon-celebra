import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info(`MongoDB connecte (${mongoose.connection.name})`);
  } catch (error) {
    logger.error(`Echec de connexion MongoDB: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
