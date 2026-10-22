import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DEFAULT_DB_PATH } from './config.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  coins         INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pets (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL DEFAULT 'Майнул',
  hunger         REAL    NOT NULL DEFAULT 100 CHECK (hunger      BETWEEN 0 AND 100),
  cleanliness    REAL    NOT NULL DEFAULT 100 CHECK (cleanliness BETWEEN 0 AND 100),
  sleep          REAL    NOT NULL DEFAULT 100 CHECK (sleep       BETWEEN 0 AND 100),
  joy            REAL    NOT NULL DEFAULT 100 CHECK (joy         BETWEEN 0 AND 100),
  waste_count    INTEGER NOT NULL DEFAULT 0   CHECK (waste_count BETWEEN 0 AND 3),
  waste_progress REAL    NOT NULL DEFAULT 0,
  is_sleeping    INTEGER NOT NULL DEFAULT 0   CHECK (is_sleeping IN (0, 1)),
  last_pat_at    INTEGER NOT NULL DEFAULT 0,
  updated_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT    NOT NULL UNIQUE,
  category     TEXT    NOT NULL CHECK (category IN ('food', 'medicine')),
  name         TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  price        INTEGER NOT NULL CHECK (price > 0),
  effect_type  TEXT    NOT NULL CHECK (effect_type IN ('hunger', 'sleep')),
  effect_value INTEGER NOT NULL CHECK (effect_value > 0),
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id  INTEGER NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id          TEXT    PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at  INTEGER NOT NULL,
  finished_at INTEGER
);

CREATE TABLE IF NOT EXISTS game_results (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL CHECK (score >= 0),
  coins_earned INTEGER NOT NULL CHECK (coins_earned >= 0),
  played_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_results_user ON game_results(user_id, score DESC);
`;

// Стартовый каталог. Добавляется только если такого code ещё нет,
// поэтому правки цен/описаний прямо в БД не затираются.
export const SEED_ITEMS = [
  { code: 'apple',      category: 'food',     name: 'Яблоко',           description: 'Хрустящее и лёгкое. Утолит небольшой голод.',                      price: 10, effect_type: 'hunger', effect_value: 15 },
  { code: 'orange',     category: 'food',     name: 'Апельсин',         description: 'Сочная долька солнца. Немного бодрит и неплохо насыщает.',         price: 15, effect_type: 'hunger', effect_value: 22 },
  { code: 'chips',      category: 'food',     name: 'Чипсы',            description: 'Солёные и хрустящие. Майнул от них в восторге.',                   price: 25, effect_type: 'hunger', effect_value: 32 },
  { code: 'pizza',      category: 'food',     name: 'Пицца',            description: 'Целый ломтик с сыром и колбасками. Самая сытная еда.',            price: 40, effect_type: 'hunger', effect_value: 50 },
  { code: 'hunger_med', category: 'medicine', name: 'Сытный эликсир',   description: 'Мгновенно и сильно восстанавливает сытость. Дорого, зато надёжно.', price: 90, effect_type: 'hunger', effect_value: 80 },
  { code: 'sleep_med',  category: 'medicine', name: 'Бодрящий эликсир', description: 'Прогоняет усталость: сильно восстанавливает шкалу сна.',            price: 90, effect_type: 'sleep',  effect_value: 80 },
];

export function initSchema(db) {
  db.exec(SCHEMA);
  const insert = db.prepare(`
    INSERT INTO items (code, category, name, description, price, effect_type, effect_value, sort_order)
    VALUES (@code, @category, @name, @description, @price, @effect_type, @effect_value, @sort_order)
    ON CONFLICT(code) DO NOTHING`);
  db.transaction(() => {
    SEED_ITEMS.forEach((item, i) => insert.run({ ...item, sort_order: i }));
  })();
}

export function openDb(file = process.env.DB_PATH || DEFAULT_DB_PATH) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}
