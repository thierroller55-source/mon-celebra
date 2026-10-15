import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Base MongoDB EN MEMOIRE pour les tests, sans dependre d'un serveur externe.
 *
 * Ces variables sont definies au tout debut du module, donc AVANT tout
 * `await` et avant que src/config/env.js (importe plus loin par app.js) ne
 * lise process.env. Sans cela, l'evaluation asynchrone chargerait env.js avec
 * les valeurs du .env (MongoDB Atlas reel) : les tests ne doivent JAMAIS
 * toucher la base distante.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-1234567890';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret-1234567890';
process.env.STORAGE_DRIVER = 'local';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'moncelebra-test-uploads');

const mongoServer = await MongoMemoryServer.create();

/**
 * Connecte Mongoose a l'instance en memoire (independamment de env.MONGO_URI,
 * qui a pu etre charge depuis le .env avant l'ecriture du port dynamique).
 */
export async function connectTestDB() {
  await mongoose.connect(mongoServer.getUri());
}

export async function disconnectTestDB() {
  await mongoose.connection.close();
}

export async function stopMongo() {
  await mongoServer.stop();
  const { rm } = await import('node:fs/promises');
  await rm(process.env.UPLOAD_DIR, { recursive: true, force: true }).catch(() => {});
}
