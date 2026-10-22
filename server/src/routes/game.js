import crypto from 'node:crypto';
import { Router } from 'express';
import { HttpError, asInt, bad, conflict } from '../http.js';

export function gameRouter({ db, cfg, clock, petService }) {
  const router = Router();
  const g = cfg.game;
  const { syncPet, persist, snapshot } = petService;

  const insertSession = db.prepare('INSERT INTO game_sessions (id, user_id, started_at) VALUES (?, ?, ?)');
  const findSession = db.prepare('SELECT * FROM game_sessions WHERE id = ? AND user_id = ?');
  const finishSession = db.prepare('UPDATE game_sessions SET finished_at = ? WHERE id = ? AND finished_at IS NULL');
  const insertResult = db.prepare('INSERT INTO game_results (user_id, score, coins_earned, played_at) VALUES (?, ?, ?, ?)');
  const addCoins = db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?');
  const stats = db.prepare('SELECT COALESCE(MAX(score), 0) AS best, COUNT(*) AS played FROM game_results WHERE user_id = ?');

  router.get('/stats', (req, res) => {
    const s = stats.get(req.user.id);
    res.json({ best: s.best, played: s.played, maxCoins: g.maxCoins });
  });

  // Партия начинается на сервере: так награду можно проверить по времени.
  router.post('/start', (req, res) => {
    const pet = syncPet(req.user.id);
    persist(pet);
    if (pet.is_sleeping) throw conflict('Майнул спит. Играть можно, когда он проснётся', 'PET_SLEEPING');
    const id = crypto.randomUUID();
    insertSession.run(id, req.user.id, clock());
    res.status(201).json({ sessionId: id, durationSec: g.durationSec, lives: g.lives });
  });

  router.post('/result', (req, res) => {
    const body = req.body ?? {};
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    const caught = asInt(body.caught, { min: 0, max: g.maxCatches, name: 'число пойманных предметов' });
    if (!sessionId) throw bad('Не указана партия');

    const now = clock();
    const out = db.transaction(() => {
      const session = findSession.get(sessionId, req.user.id);
      if (!session) throw new HttpError(404, 'SESSION_NOT_FOUND', 'Партия не найдена');
      if (session.finished_at) throw conflict('Награда за эту партию уже получена', 'SESSION_FINISHED');

      const elapsedSec = (now - session.started_at) / 1000;
      if (now - session.started_at > g.sessionTtlMs) {
        finishSession.run(now, sessionId);
        return { error: new HttpError(410, 'SESSION_EXPIRED', 'Партия устарела. Сыграйте ещё раз') };
      }
      if (elapsedSec < g.minDurationSec || caught > Math.floor(elapsedSec / g.minCatchIntervalSec)) {
        finishSession.run(now, sessionId);
        return { error: bad('Результат не прошёл проверку', 'SUSPICIOUS_RESULT') };
      }

      finishSession.run(now, sessionId);
      const coinsEarned = Math.min(g.maxCoins, Math.floor(caught * g.coinsPerCatch));
      const score = caught * 10;
      insertResult.run(req.user.id, score, coinsEarned, now);
      addCoins.run(coinsEarned, req.user.id);

      const pet = syncPet(req.user.id);
      const joyBonus = Math.min(g.joyMax, Math.round(g.joyBase + caught * g.joyPerCatch));
      pet.joy = Math.min(100, pet.joy + joyBonus);
      pet.sleep = Math.max(0, pet.sleep - g.sleepCost);
      persist(pet);

      const s = stats.get(req.user.id);
      return { pet, coinsEarned, score, best: s.best };
    })();

    // Ошибки «проверки» отдаём после коммита, чтобы партия осталась закрытой
    if (out.error) throw out.error;
    res.json(snapshot(req.user.id, out.pet, { result: { score: out.score, coinsEarned: out.coinsEarned, best: out.best } }));
  });

  return router;
}
