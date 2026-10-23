// Демо-режим для GitHub Pages: вместо сервера данные живут в памяти страницы.
const wait = (value) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), 150));
const clamp = (n) => Math.max(0, Math.min(100, n));
const fail = (status, message) => Object.assign(new Error(message), { status, code: 'ERROR' });

const CATALOG = [
  { id: 1, code: 'apple', name: 'Яблоко', category: 'food', effectValue: 15, price: 10 },
  { id: 2, code: 'chips', name: 'Чипсы', category: 'food', effectValue: 25, price: 20 },
  { id: 3, code: 'pizza', name: 'Пицца', category: 'food', effectValue: 50, price: 40 },
];

const state = {
  username: 'Гость',
  coins: 100,
  pet: {
    name: 'Майнул',
    hunger: 40,
    happiness: 70,
    energy: 80,
    cleanliness: 55,
    isSleeping: false,
    wasteCount: 2,
  },
  stock: { 1: 3, 2: 2, 3: 1 },
  game: { played: 0, caught: 0, best: 0 },
};

function petView() {
  const p = state.pet;
  let mood = 'happy';
  if (p.hunger < 30) mood = 'hungry';
  else if (p.energy < 30) mood = 'sleepy';
  else if (p.happiness < 30) mood = 'sad';
  return { ...p, mood, isDirty: p.cleanliness < 30, coins: state.coins };
}

const withPet = (extra = {}) => ({ pet: petView(), ...extra });
const user = () => ({ id: 1, username: state.username });
const inventoryItems = () =>
  CATALOG.filter((i) => state.stock[i.id] > 0).map(({ price, ...i }) => ({
    ...i,
    quantity: state.stock[i.id],
  }));

export const demoApi = {
  register: (username) => {
    state.username = username || 'Гость';
    return wait({ token: 'demo', user: user() });
  },
  login: (username) => {
    state.username = username || 'Гость';
    return wait({ token: 'demo', user: user() });
  },
  me: () => wait({ user: user() }),

  pet: () => wait(withPet()),
  wash: () => {
    state.pet.cleanliness = 100;
    return wait(withPet());
  },
  sleep: (sleeping) => {
    state.pet.isSleeping = Boolean(sleeping);
    return wait(withPet());
  },
  clean: () => {
    state.pet.wasteCount = Math.max(0, state.pet.wasteCount - 1);
    return wait(withPet());
  },
  pat: () => {
    state.pet.happiness = clamp(state.pet.happiness + 2);
    return wait(withPet());
  },

  shop: () => wait({ items: CATALOG, coins: state.coins, balance: state.coins }),
  buy: (itemId, quantity = 1) => {
    const item = CATALOG.find((i) => i.id === itemId);
    if (!item) return Promise.reject(fail(404, 'Товар не найден'));
    const cost = item.price * quantity;
    if (state.coins < cost) return Promise.reject(fail(409, 'Не хватает монет'));
    state.coins -= cost;
    state.stock[item.id] = (state.stock[item.id] || 0) + quantity;
    return wait({ ...withPet(), coins: state.coins, balance: state.coins, items: inventoryItems() });
  },

  inventory: () => wait({ items: inventoryItems() }),
  use: (itemId) => {
    const item = CATALOG.find((i) => i.id === itemId);
    if (!item || !state.stock[item.id]) return Promise.reject(fail(409, 'Этого предмета нет в инвентаре'));
    const before = state.pet.hunger;
    state.stock[item.id] -= 1;
    state.pet.hunger = clamp(before + item.effectValue);
    return wait(withPet({ used: { delta: state.pet.hunger - before }, items: inventoryItems() }));
  },

  gameStats: () => wait({ ...state.game, stats: state.game }),
  gameStart: () => wait({ sessionId: 'demo-session' }),
  gameResult: (sessionId, caught) => {
    state.game.played += 1;
    state.game.caught += caught || 0;
    state.game.best = Math.max(state.game.best, caught || 0);
    const reward = (caught || 0) * 2;
    state.coins += reward;
    return wait(withPet({ reward, coins: state.coins, ...state.game }));
  },
};