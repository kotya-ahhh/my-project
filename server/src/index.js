import { createApp } from './app.js';
import { openDb } from './db.js';
import { resolveJwtSecret, GAME } from './config.js';

const port = Number(process.env.PORT) || 3001;
const db = openDb();
const app = createApp({
  db,
  secret: resolveJwtSecret(),
  serveClient: process.env.NODE_ENV === 'production',
});

const server = app.listen(port, () => {
  console.log(`Майнул: сервер запущен на http://localhost:${port}`);
  if (GAME.timeScale !== 1) console.log(`Внимание: время ускорено в ${GAME.timeScale} раз (TIME_SCALE)`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
