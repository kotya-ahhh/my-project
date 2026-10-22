import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

let t;
before(async () => { t = await startTestServer(); });
after(async () => { await t.close(); });

const itemId = async (token, code) => {
  const { body } = await t.call('GET', '/shop', { token });
  return body.items.find((i) => i.code === code).id;
};

test('регистрация: проверка полей', async () => {
  const cases = [
    [{ username: 'ab', password: 'secret1', passwordConfirm: 'secret1' }, /от 3 до 20/],
    [{ username: 'бяка!!', password: 'secret1', passwordConfirm: 'secret1' }, /буквы, цифры/],
    [{ username: 'valid', password: '123', passwordConfirm: '123' }, /не короче 6/],
    [{ username: 'valid', password: 'secret1', passwordConfirm: 'secret2' }, /не совпадают/],
  ];
  for (const [body, re] of cases) {
    const r = await t.call('POST', '/auth/register', { body });
    assert.equal(r.status, 400);
    assert.match(r.body.error.message, re);
  }
});

test('регистрация и вход: токен, уникальность имени, неверный пароль', async () => {
  const u = await t.newUser('Мурзик');
  assert.equal(u.res.status, 201);
  assert.ok(u.token);

  const dup = await t.call('POST', '/auth/register', {
    body: { username: 'мурзик'.toUpperCase() === 'МУРЗИК' ? 'Мурзик' : '', password: 'secret1' },
  });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, 'USERNAME_TAKEN');

  const ok = await t.call('POST', '/auth/login', { body: { username: 'Мурзик', password: 'secret1' } });
  assert.equal(ok.status, 200);
  const wrong = await t.call('POST', '/auth/login', { body: { username: 'Мурзик', password: 'nope-nope' } });
  assert.equal(wrong.status, 401);
  const ghost = await t.call('POST', '/auth/login', { body: { username: 'нет-такого', password: 'secret1' } });
  assert.equal(ghost.status, 401);
  assert.equal(ghost.body.error.message, wrong.body.error.message);
});

test('без токена и с чужим токеном — 401', async () => {
  assert.equal((await t.call('GET', '/pet')).status, 401);
  assert.equal((await t.call('GET', '/pet', { token: 'garbage' })).status, 401);
});

test('новый питомец: все шкалы 100, 100 монет', async () => {
  const { token } = await t.newUser();
  const { body } = await t.call('GET', '/pet', { token });
  assert.deepEqual(
    [body.pet.hunger, body.pet.cleanliness, body.pet.sleep, body.pet.joy, body.pet.wasteCount],
    [100, 100, 100, 100, 0],
  );
  assert.equal(body.coins, 100);
  assert.equal(body.pet.name, 'Майнул');
  assert.equal(body.pet.mood, 'happy');
});

test('шкалы убывают со временем, питомец «живёт» без клиента', async () => {
  const { token } = await t.newUser();
  t.hours(4);
  const a = (await t.call('GET', '/pet', { token })).body.pet;
  assert.equal(a.hunger, 50);
  assert.ok(a.cleanliness < 100 && a.joy < 100 && a.sleep < 100);
  t.hours(20);
  const b = (await t.call('GET', '/pet', { token })).body.pet;
  assert.equal(b.hunger, 0);
  assert.equal(b.mood, 'hungry');
});

test('следы: появляются, не больше трёх, убираются с бонусом к чистоте', async () => {
  const { token } = await t.newUser();
  t.hours(2.1);
  assert.equal((await t.call('GET', '/pet', { token })).body.pet.wasteCount, 1);
  t.hours(30);
  const capped = (await t.call('GET', '/pet', { token })).body.pet;
  assert.equal(capped.wasteCount, 3);

  const before = capped.cleanliness;
  const r = await t.call('POST', '/pet/clean', { token });
  assert.equal(r.body.pet.wasteCount, 2);
  assert.equal(r.body.pet.cleanliness, Math.min(100, before + 12));

  await t.call('POST', '/pet/clean', { token });
  await t.call('POST', '/pet/clean', { token });
  assert.equal((await t.call('POST', '/pet/clean', { token })).status, 409);
});

test('мытьё: до 100%, и не нужно, если уже чисто', async () => {
  const { token } = await t.newUser();
  assert.equal((await t.call('POST', '/pet/wash', { token })).status, 409);
  t.hours(3);
  const r = await t.call('POST', '/pet/wash', { token });
  assert.equal(r.status, 200);
  assert.equal(r.body.pet.cleanliness, 100);
});

test('сон: нельзя, если бодр; во сне блокируются мытьё, еда и игра; шкала растёт и питомец просыпается', async () => {
  const { token } = await t.newUser();
  assert.equal((await t.call('POST', '/pet/sleep', { token, body: { sleeping: true } })).status, 409);
  t.hours(6);
  const before = (await t.call('GET', '/pet', { token })).body.pet;
  const slept = await t.call('POST', '/pet/sleep', { token, body: { sleeping: true } });
  assert.equal(slept.body.pet.isSleeping, true);
  assert.equal(slept.body.pet.mood, 'sleeping');

  assert.equal((await t.call('POST', '/pet/wash', { token })).status, 409);
  assert.equal((await t.call('POST', '/game/start', { token })).body.error.code, 'PET_SLEEPING');
  const apple = await itemId(token, 'apple');
  await t.call('POST', '/shop/buy', { token, body: { itemId: apple, quantity: 1 } });
  const feed = await t.call('POST', '/inventory/use', { token, body: { itemId: apple } });
  assert.equal(feed.body.error.code, 'PET_SLEEPING');

  t.seconds(20 * 60); // 20 минут сна
  const mid = (await t.call('GET', '/pet', { token })).body.pet;
  assert.ok(mid.sleep > before.sleep, 'сон растёт');
  assert.equal(mid.isSleeping, true);
  assert.ok(mid.hunger > before.hunger - 5, 'во сне голод убывает медленнее');

  t.hours(0.4); // ещё немного — и питомец сам просыпается
  const after = (await t.call('GET', '/pet', { token })).body.pet;
  assert.ok(after.sleep >= 95, 'выспался');
  assert.equal(after.isSleeping, false);
});

test('поглаживание: даёт радость, но с ограничением частоты', async () => {
  const { token } = await t.newUser();
  t.hours(3);
  const first = await t.call('POST', '/pet/pat', { token });
  assert.equal(first.body.gained, 3);
  const spam = await t.call('POST', '/pet/pat', { token });
  assert.equal(spam.body.gained, 0);
  t.seconds(3.1);
  assert.equal((await t.call('POST', '/pet/pat', { token })).body.gained, 3);
});

test('магазин: покупка, нехватка монет, неверное количество, нет товара', async () => {
  const { token } = await t.newUser();
  const catalog = await t.call('GET', '/shop', { token });
  assert.ok(catalog.body.items.length >= 6);
  assert.ok(catalog.body.items.some((i) => i.category === 'medicine'));

  const pizza = await itemId(token, 'pizza'); // 40
  const buy = await t.call('POST', '/shop/buy', { token, body: { itemId: pizza, quantity: 2 } });
  assert.equal(buy.status, 200);
  assert.equal(buy.body.coins, 20);

  const poor = await t.call('POST', '/shop/buy', { token, body: { itemId: pizza, quantity: 1 } });
  assert.equal(poor.status, 409);
  assert.equal(poor.body.error.code, 'NOT_ENOUGH_COINS');
  assert.equal((await t.call('GET', '/shop', { token })).body.coins, 20, 'монеты не ушли в минус');

  for (const quantity of [0, -1, 1.5, 'много', 1000]) {
    assert.equal((await t.call('POST', '/shop/buy', { token, body: { itemId: pizza, quantity } })).status, 400);
  }
  assert.equal((await t.call('POST', '/shop/buy', { token, body: { itemId: 9999, quantity: 1 } })).status, 404);

  const inv = await t.call('GET', '/inventory', { token });
  assert.equal(inv.body.items[0].quantity, 2);
});

test('инвентарь: сытого не кормим (предмет цел), голодного кормим, пустое исчезает', async () => {
  const { token } = await t.newUser();
  const apple = await itemId(token, 'apple');
  await t.call('POST', '/shop/buy', { token, body: { itemId: apple, quantity: 2 } });

  const full = await t.call('POST', '/inventory/use', { token, body: { itemId: apple } });
  assert.equal(full.status, 409);
  assert.equal((await t.call('GET', '/inventory', { token })).body.items[0].quantity, 2);

  t.hours(4); // голод ≈ 50
  const fed = await t.call('POST', '/inventory/use', { token, body: { itemId: apple } });
  assert.equal(fed.status, 200);
  assert.equal(fed.body.pet.hunger, 65);
  assert.equal(fed.body.used.delta, 15);
  assert.equal(fed.body.inventory[0].quantity, 1);

  await t.call('POST', '/inventory/use', { token, body: { itemId: apple } });
  assert.equal((await t.call('GET', '/inventory', { token })).body.items.length, 0);
  assert.equal((await t.call('POST', '/inventory/use', { token, body: { itemId: apple } })).status, 404);
});

test('лекарство сна поднимает шкалу сна', async () => {
  const { token } = await t.newUser();
  await t.call('POST', '/shop/buy', { token, body: { itemId: await itemId(token, 'sleep_med'), quantity: 1 } });
  t.hours(6);
  const before = (await t.call('GET', '/pet', { token })).body.pet.sleep;
  const r = await t.call('POST', '/inventory/use', { token, body: { itemId: await itemId(token, 'sleep_med') } });
  assert.equal(r.body.pet.sleep, Math.min(100, before + 80));
});

test('мини-игра: награда считается на сервере, ограничена и выдаётся один раз', async () => {
  const { token } = await t.newUser();
  const start = await t.call('POST', '/game/start', { token });
  assert.equal(start.status, 201);
  const { sessionId } = start.body;

  // слишком быстро
  const tooFast = await t.call('POST', '/game/result', { token, body: { sessionId, caught: 10 } });
  assert.equal(tooFast.status, 400);
  assert.equal(tooFast.body.error.code, 'SUSPICIOUS_RESULT');
  // и партия уже закрыта — подбирать результат нельзя
  t.seconds(30);
  assert.equal((await t.call('POST', '/game/result', { token, body: { sessionId, caught: 5 } })).status, 409);

  const s2 = (await t.call('POST', '/game/start', { token })).body.sessionId;
  t.seconds(40);
  const before = (await t.call('GET', '/pet', { token })).body;
  const done = await t.call('POST', '/game/result', { token, body: { sessionId: s2, caught: 12 } });
  assert.equal(done.status, 200);
  assert.equal(done.body.result.coinsEarned, 18);
  assert.equal(done.body.coins, before.coins + 18);
  assert.ok(done.body.pet.sleep < before.pet.sleep, 'игра утомляет');
  assert.equal((await t.call('POST', '/game/result', { token, body: { sessionId: s2, caught: 12 } })).status, 409);

  const stats = await t.call('GET', '/game/stats', { token });
  assert.deepEqual([stats.body.best, stats.body.played], [120, 1]);
});

test('мини-игра: потолок награды и чужая партия', async () => {
  const a = await t.newUser();
  const b = await t.newUser();
  const s = (await t.call('POST', '/game/start', { token: a.token })).body.sessionId;
  t.seconds(60);
  assert.equal((await t.call('POST', '/game/result', { token: b.token, body: { sessionId: s, caught: 1 } })).status, 404);
  assert.equal((await t.call('POST', '/game/result', { token: a.token, body: { sessionId: s, caught: 999 } })).status, 400);
  const ok = await t.call('POST', '/game/result', { token: a.token, body: { sessionId: s, caught: 80 } });
  assert.equal(ok.body.result.coinsEarned, 60, 'не больше maxCoins');
});

test('неизвестный адрес API — 404 в JSON', async () => {
  const { token } = await t.newUser();
  const r = await t.call('GET', '/nope', { token });
  assert.equal(r.status, 404);
  assert.equal(r.body.error.code, 'NOT_FOUND');
});
