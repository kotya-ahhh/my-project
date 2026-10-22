import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';

/** Поднимает приложение на свободном порту с in-memory БД и управляемыми часами. */
export async function startTestServer() {
  const db = openDb(':memory:');
  const clock = { now: 1_800_000_000_000 };
  const app = createApp({ db, secret: 'test-secret', clock: () => clock.now, limitAuth: false });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  async function call(method, path, { body, token } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  }

  let counter = 0;
  async function newUser(name = `user${++counter}`) {
    const r = await call('POST', '/auth/register', {
      body: { username: name, password: 'secret1', passwordConfirm: 'secret1' },
    });
    return { token: r.body.token, name, res: r };
  }

  return {
    db,
    clock,
    call,
    newUser,
    hours: (h) => (clock.now += h * 3_600_000),
    seconds: (s) => (clock.now += s * 1000),
    close: () => new Promise((resolve) => server.close(() => (db.close(), resolve()))),
  };
}
