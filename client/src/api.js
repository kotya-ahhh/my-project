// Тонкая обёртка над fetch: токен, JSON, единый формат ошибок.
import { demoApi } from './demoApi.js';

const BASE = '/api';
const TOKEN_KEY = 'mainul_token';
const DEMO = import.meta.env.VITE_DEMO === 'true';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let token = localStorage.getItem(TOKEN_KEY);
let onUnauthorized = () => {};

export const getToken = () => token;
export function setToken(value) {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Нет связи с сервером. Проверьте подключение и попробуйте ещё раз');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data?.error?.code ?? 'ERROR';
    // 401 на входе — это «неверный пароль», а не «сессия истекла»
    if (res.status === 401 && token && code === 'UNAUTHORIZED') onUnauthorized();
    throw new ApiError(res.status, code, data?.error?.message ?? 'Не удалось выполнить запрос');
  }
  return data;
}

const realApi = {
  register: (username, password, passwordConfirm) => request('POST', '/auth/register', { username, password, passwordConfirm }),
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  me: () => request('GET', '/auth/me'),

  pet: () => request('GET', '/pet'),
  wash: () => request('POST', '/pet/wash'),
  sleep: (sleeping) => request('POST', '/pet/sleep', { sleeping }),
  clean: () => request('POST', '/pet/clean'),
  pat: () => request('POST', '/pet/pat'),

  shop: () => request('GET', '/shop'),
  buy: (itemId, quantity) => request('POST', '/shop/buy', { itemId, quantity }),

  inventory: () => request('GET', '/inventory'),
  use: (itemId) => request('POST', '/inventory/use', { itemId }),

  gameStats: () => request('GET', '/game/stats'),
  gameStart: () => request('POST', '/game/start'),
  gameResult: (sessionId, caught) => request('POST', '/game/result', { sessionId, caught }),
};

// В демо-режиме (GitHub Pages) вместо сервера работает заглушка, вход происходит автоматически.
export const api = DEMO ? demoApi : realApi;
if (DEMO && !token) setToken('demo');