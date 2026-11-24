import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { config, IS_PROD, IS_TEST } from './config.js';
import { HttpError } from './lib/errors.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../../client/dist');

// Reject query operators like {"$gt": ""} coming from user input.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'style-src': ["'self'", "'unsafe-inline'", 'https://rsms.me'],
          'font-src': ["'self'", 'https://rsms.me'],
          'img-src': ["'self'", 'data:'],
          'upgrade-insecure-requests': IS_PROD ? [] : null,
        },
      },
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());
  app.use('/api', rateLimit({ windowMs: 60_000, limit: IS_TEST ? 10_000 : 300, standardHeaders: true, legacyHeaders: false }));

  app.use('/api', publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

  // Built client. Fingerprinted assets are cached forever; index.html never is.
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(clientDist, { index: false }));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }, (err) => {
      if (err) res.status(404).send('Client not built. Run "npm run build" from the project root.');
    });
  });

  // Errors (Express 5 forwards rejected promises here).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Resume must be 5 MB or smaller' : 'Invalid upload';
      return res.status(400).json({ message });
    }
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ message: first?.message ?? 'Invalid data' });
    }
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid value' });
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern ?? {})[0];
      return res.status(409).json({ message: field === 'rollNumber' ? 'That roll number is already registered' : 'Already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  });

  return app;
}
