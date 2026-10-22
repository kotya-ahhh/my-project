import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GAME, CLIENT_DIST } from './config.js';
import { HttpError, errorHandler } from './http.js';
import { createPetService } from './petService.js';
import { authRouter, requireAuth } from './routes/auth.js';
import { petRouter } from './routes/pet.js';
import { shopRouter } from './routes/shop.js';
import { inventoryRouter } from './routes/inventory.js';
import { gameRouter } from './routes/game.js';

/**
 * Фабрика приложения: БД, часы и настройки передаются снаружи,
 * поэтому в тестах можно подставить in-memory базу и «перемотать» время.
 */
export function createApp({ db, secret, clock = Date.now, cfg = GAME, serveClient = false, limitAuth = true }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  const petService = createPetService(db, clock, cfg);
  const auth = requireAuth({ db, secret });
  const ctx = { db, secret, clock, cfg, petService };

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true }));

  const authLimiter = limitAuth
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 60,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, _res, next) =>
          next(new HttpError(429, 'TOO_MANY_REQUESTS', 'Слишком много попыток. Подождите несколько минут')),
      })
    : (_req, _res, next) => next();
  api.use('/auth', authLimiter, authRouter(ctx));
  api.get('/auth/me', auth, (req, res) => res.json({ user: req.user }));

  api.use('/pet', auth, petRouter(ctx));
  api.use('/shop', auth, shopRouter(ctx));
  api.use('/inventory', auth, inventoryRouter(ctx));
  api.use('/game', auth, gameRouter(ctx));
  api.use((_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Такого адреса нет')));
  app.use('/api', api);

  // В «боевом» режиме Express сам отдаёт собранный клиент (SPA)
  if (serveClient && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
