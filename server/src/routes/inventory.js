import { Router } from 'express';
import { HttpError, asInt, conflict } from '../http.js';
import { isFull } from '../petLogic.js';
import { publicItem } from './shop.js';

export function inventoryRouter({ db, petService }) {
  const router = Router();
  const { syncPet, persist, snapshot } = petService;

  const list = db.prepare(`
    SELECT items.*, inventory.quantity FROM inventory
    JOIN items ON items.id = inventory.item_id
    WHERE inventory.user_id = ? ORDER BY items.sort_order, items.id`);
  const stock = db.prepare('SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?');
  const findItem = db.prepare('SELECT * FROM items WHERE id = ?');
  const decrement = db.prepare('UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 1');
  const removeLast = db.prepare('DELETE FROM inventory WHERE user_id = ? AND item_id = ? AND quantity = 1');

  const inventoryOf = (userId) => list.all(userId).map((r) => ({ ...publicItem(r), quantity: r.quantity }));

  router.get('/', (req, res) => {
    res.json({ items: inventoryOf(req.user.id) });
  });

  router.post('/use', (req, res) => {
    const itemId = asInt(req.body?.itemId, { min: 1, name: 'предмет' });

    const out = db.transaction(() => {
      const item = findItem.get(itemId);
      if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Такого предмета не существует');
      if (!(stock.get(req.user.id, itemId)?.quantity > 0)) {
        throw new HttpError(404, 'NOT_IN_INVENTORY', 'Этого предмета нет в инвентаре');
      }
      const pet = syncPet(req.user.id);
      if (pet.is_sleeping) throw conflict('Майнул спит. Сначала разбудите его', 'PET_SLEEPING');

      const stat = item.effect_type; // 'hunger' | 'sleep'
      if (isFull(pet[stat])) {
        throw conflict(
          stat === 'hunger' ? 'Майнул не голоден' : 'Майнул полон сил',
          'ALREADY_FULL',
        );
      }
      const before = pet[stat];
      pet[stat] = Math.min(100, before + item.effect_value);
      // Последняя штука удаляется из инвентаря целиком (CHECK quantity > 0)
      if (removeLast.run(req.user.id, itemId).changes === 0) decrement.run(req.user.id, itemId);
      persist(pet);
      return { pet, item, delta: Math.round(pet[stat] - before) };
    })();

    res.json(
      snapshot(req.user.id, out.pet, {
        used: { item: publicItem(out.item), stat: out.item.effect_type, delta: out.delta },
        inventory: inventoryOf(req.user.id),
      }),
    );
  });

  return router;
}
