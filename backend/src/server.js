import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { APP_NAME } from './config/brand.js';
import { logger } from './utils/logger.js';
import { connectDB } from './config/db.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API ${APP_NAME} demarree : http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

connectDB().catch((error) => {
  logger.warn(
    `API demarree sans connexion MongoDB. Verifiez MONGO_URI. (${error.message})`,
  );
});

function shutdown(signal) {
  logger.info(`Arret du serveur (${signal})...`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
