import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import { APP_NAME } from './config/brand.js';
import apiRoutes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { originGuard } from './middleware/originGuard.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tile.openstreetmap.org',
          'https://tile.openstreetmap.org',
          'https://*.basemaps.cartocdn.com',
          'https://res.cloudinary.com',
        ],
      },
    },
  }),
);

// CLIENT_URL accepte une ou plusieurs origines separees par des virgules,
// ce qui permet d'autoriser a la fois le frontend local et celui deploye.
const allowedOrigins = env.CLIENT_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
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
    name: `${APP_NAME} API`,
    slogan: "Chaque moment merite d'etre celebre.",
  });
});

app.use('/api', originGuard, globalLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
