import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

if (!env.isProduction) {
  app.use(morgan('dev'));
}

// Fichiers uploades (a proteger/segmenter davantage selon les besoins)
app.use('/uploads', express.static(env.uploadDir));

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Mon Celebra API',
    slogan: "Chaque moment merite d'etre celebre.",
  });
});

app.use('/api', globalLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
