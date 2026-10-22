import { Router } from 'express';
import { HttpError, asInt, bad } from '../http.js';

export const publicItem = (i) => ({
  id: i.id,
  code: i.code,
  category: i.category,
  name: i.name,
  description: i.description,
  price: i.price,
  effectType: i.effect_type,
  effectValue: i.effect_value,
});

export function shopRouter({ db, cfg, petService }) {
  const router = Router();
  const listItems = db.prepare('SELECT * FROM items ORDER BY sort_order, id');
  const findItem = db.prepare('SELECT * FROM items WHERE id = ?');
  const pay = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?');
  const stock = db.prepare('SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?');
  const addToInventory = db.prepare(`
    INSERT INTO inventory (user_id, item_id, quantity) VALUES (?, ?, ?)
    ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity`);

  router.get('/', (req, res) => {
    res.json({ items: listItems.all().map(publicItem), coins: petService.getCoins(req.user.id) });
  });

  router.post('/buy', (req, res) => {
    const body = req.body ?? {};
    const itemId = asInt(body.itemId, { min: 1, name: 'товар' });
    const quantity = asInt(body.quantity ?? 1, { min: 1, max: cfg.shop.maxPerPurchase, name: 'количество' });

    const result = db.transaction(() => {
      const item = findItem.get(itemId);
      if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Такого товара нет в магазине');
      const have = stock.get(req.user.id, itemId)?.quantity ?? 0;
      if (have + quantity > cfg.shop.maxStack) throw bad(`В инвентаре может быть не больше ${cfg.shop.maxStack} штук`);
      const total = item.price * quantity;
      if (pay.run(total, req.user.id, total).changes === 0) {
        throw new HttpError(409, 'NOT_ENOUGH_COINS', 'Не хватает монет');
      }
      addToInventory.run(req.user.id, itemId, quantity);
      return { item, quantity, total };
    })();

    res.json({
      coins: petService.getCoins(req.user.id),
      purchased: { item: publicItem(result.item), quantity: result.quantity, total: result.total },
    });
  });

  return router;
}
