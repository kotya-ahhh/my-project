import { advance, serializePet } from './petLogic.js';
import { GAME } from './config.js';

/**
 * Работа с питомцем и кошельком в БД.
 * Все обработчики синхронные (better-sqlite3), поэтому каждый запрос
 * выполняется целиком и «гонок» между запросами не бывает.
 */
export function createPetService(db, clock, cfg = GAME) {
  const selectPet = db.prepare('SELECT * FROM pets WHERE user_id = ?');
  const savePet = db.prepare(`
    UPDATE pets SET hunger=@hunger, cleanliness=@cleanliness, sleep=@sleep, joy=@joy,
      waste_count=@waste_count, waste_progress=@waste_progress, is_sleeping=@is_sleeping,
      last_pat_at=@last_pat_at, updated_at=@updated_at
    WHERE id=@id`);
  const selectCoins = db.prepare('SELECT coins FROM users WHERE id = ?');

  /** Достаёт питомца и «доживает» его до текущего момента. */
  function syncPet(userId) {
    const row = selectPet.get(userId);
    if (!row) return null;
    const now = clock();
    const pet = advance(row, now - row.updated_at, cfg);
    pet.updated_at = now;
    return pet;
  }

  function persist(pet) {
    savePet.run(pet);
    return pet;
  }

  const getCoins = (userId) => selectCoins.get(userId).coins;

  /** Единый ответ для всех «питомцевых» запросов. */
  function snapshot(userId, pet, extra = {}) {
    return { pet: serializePet(pet, cfg), coins: getCoins(userId), serverTime: clock(), ...extra };
  }

  return { syncPet, persist, getCoins, snapshot };
}
