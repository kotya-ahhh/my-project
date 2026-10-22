// Все «игровые» числа собраны здесь: баланс можно менять, не трогая логику.
// Для демонстрации время можно ускорить: TIME_SCALE=60 npm run dev
// (1 реальная минута = 1 игровой час).
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '..');

export const DEFAULT_DB_PATH = path.join(SERVER_ROOT, 'data', 'mainul.db');
export const CLIENT_DIST = path.resolve(SERVER_ROOT, '..', 'client', 'dist');

/** JWT-секрет: из переменной окружения или из файла (создаётся при первом запуске). */
export function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const file = path.join(SERVER_ROOT, 'data', '.jwt-secret');
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const secret = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(file, secret, { mode: 0o600 });
    return secret;
  }
}

export const GAME = {
  timeScale: Number(process.env.TIME_SCALE) > 0 ? Number(process.env.TIME_SCALE) : 1,
  maxCatchUpHours: 240, // дольше не «догоняем» — всё уже на нуле

  // Убывание шкал в час (100 / 12.5 = 8 часов до нуля у голода)
  decayPerHour: { hunger: 12.5, cleanliness: 10, sleep: 9, joy: 11 },
  sleepDecayFactor: 0.3, // во сне остальные шкалы убывают медленнее
  sleepGainPerHour: 100, // шкала сна во сне растёт
  lowThreshold: 20, // ниже — питомец «просит внимания»

  // Следы жизнедеятельности
  wasteIntervalHours: 2,
  wasteMax: 3,
  wastePenaltyPerHour: { cleanliness: 4, joy: 3 }, // за каждый неубранный след
  lowStatJoyPenaltyPerHour: 3, // за каждую просевшую шкалу (голод/чистота/сон)
  cleanBonus: 12, // за каждый убранный след

  startCoins: 100,

  pat: { gain: 3, cooldownMs: 3000 }, // радость за поглаживание и «перезарядка»

  game: {
    durationSec: 45,
    lives: 3,
    coinsPerCatch: 1.5,
    maxCoins: 60,
    maxCatches: 80,
    minCatchIntervalSec: 0.3, // быстрее физически не поймать
    minDurationSec: 2,
    sessionTtlMs: 5 * 60 * 1000,
    sleepCost: 12, // мини-игра утомляет
    joyBase: 8,
    joyPerCatch: 0.5,
    joyMax: 30,
  },

  shop: { maxPerPurchase: 99, maxStack: 999 },
};

export const JWT_TTL = '30d';
