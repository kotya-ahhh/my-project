import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError, bad, conflict } from '../http.js';
import { GAME, JWT_TTL } from '../config.js';

const USERNAME_RE = /^[\p{L}\p{N}_.-]+$/u;
const BCRYPT_ROUNDS = 10;
// Хеш-«пустышка»: сравниваем с ним, если пользователя нет, чтобы ответ шёл за то же время
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

export function validateCredentials({ username, password, passwordConfirm }, { register }) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw bad('Введите имя пользователя и пароль');
  }
  const name = username.trim();
  if (register) {
    if (name.length < 3 || name.length > 20) throw bad('Имя должно быть от 3 до 20 символов');
    if (!USERNAME_RE.test(name)) throw bad('В имени можно использовать буквы, цифры, «_», «-» и «.»');
    if (password.length < 6) throw bad('Пароль должен быть не короче 6 символов');
    if (password.length > 72) throw bad('Пароль должен быть не длиннее 72 символов');
    if (passwordConfirm !== undefined && passwordConfirm !== password) throw bad('Пароли не совпадают');
  } else if (!name || !password) {
    throw bad('Введите имя пользователя и пароль');
  }
  return name;
}

export function authRouter({ db, secret, clock }) {
  const router = Router();
  const findUser = db.prepare('SELECT * FROM users WHERE username = ?');
  const insertUser = db.prepare('INSERT INTO users (username, password_hash, coins, created_at) VALUES (?, ?, ?, ?)');
  const insertPet = db.prepare('INSERT INTO pets (user_id, updated_at) VALUES (?, ?)');

  const issueToken = (user) => jwt.sign({ sub: user.id }, secret, { expiresIn: JWT_TTL });
  const publicUser = (u) => ({ id: u.id, username: u.username });

  router.post('/register', async (req, res) => {
    const username = validateCredentials(req.body ?? {}, { register: true });
    const hash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
    let user;
    try {
      user = db.transaction(() => {
        const now = clock();
        const { lastInsertRowid } = insertUser.run(username, hash, GAME.startCoins, now);
        insertPet.run(lastInsertRowid, now);
        return { id: Number(lastInsertRowid), username };
      })();
    } catch (err) {
      if (String(err.code).startsWith('SQLITE_CONSTRAINT')) throw conflict('Это имя уже занято', 'USERNAME_TAKEN');
      throw err;
    }
    res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  });

  router.post('/login', async (req, res) => {
    const username = validateCredentials(req.body ?? {}, { register: false });
    const user = findUser.get(username);
    const ok = await bcrypt.compare(req.body.password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'BAD_CREDENTIALS', 'Неверное имя пользователя или пароль');
    res.json({ token: issueToken(user), user: publicUser(user) });
  });

  return router;
}

/** Middleware: проверяет JWT и кладёт пользователя в req.user. */
export function requireAuth({ db, secret }) {
  const findById = db.prepare('SELECT id, username FROM users WHERE id = ?');
  return (req, _res, next) => {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new HttpError(401, 'UNAUTHORIZED', 'Нужно войти в аккаунт'));
    }
    try {
      const payload = jwt.verify(token, secret);
      const user = findById.get(payload.sub);
      if (!user) throw new Error('no user');
      req.user = user;
      next();
    } catch {
      next(new HttpError(401, 'UNAUTHORIZED', 'Сессия истекла. Войдите снова'));
    }
  };
}
