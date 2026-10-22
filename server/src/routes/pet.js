import { Router } from 'express';
import { HttpError, bad, conflict } from '../http.js';
import { isFull } from '../petLogic.js';

export function petRouter({ petService, cfg, clock }) {
  const router = Router();
  const { syncPet, persist, snapshot } = petService;

  router.get('/', (req, res) => {
    const pet = syncPet(req.user.id);
    persist(pet);
    res.json(snapshot(req.user.id, pet));
  });

  router.post('/wash', (req, res) => {
    const pet = syncPet(req.user.id);
    if (pet.is_sleeping) throw conflict('Майнул спит. Сначала разбудите его', 'PET_SLEEPING');
    if (isFull(pet.cleanliness)) throw conflict('Майнул и так чистый', 'ALREADY_FULL');
    pet.cleanliness = 100;
    persist(pet);
    res.json(snapshot(req.user.id, pet));
  });

  router.post('/sleep', (req, res) => {
    const { sleeping } = req.body ?? {};
    if (typeof sleeping !== 'boolean') throw bad('Укажите, уложить или разбудить');
    const pet = syncPet(req.user.id);
    if (sleeping && !pet.is_sleeping && isFull(pet.sleep)) {
      throw conflict('Майнул полон сил и спать не хочет', 'ALREADY_FULL');
    }
    pet.is_sleeping = sleeping ? 1 : 0;
    persist(pet);
    res.json(snapshot(req.user.id, pet));
  });

  router.post('/clean', (req, res) => {
    const pet = syncPet(req.user.id);
    if (pet.waste_count <= 0) throw conflict('Убирать нечего', 'NOTHING_TO_CLEAN');
    pet.waste_count -= 1;
    pet.cleanliness = Math.min(100, pet.cleanliness + cfg.cleanBonus);
    persist(pet);
    res.json(snapshot(req.user.id, pet));
  });

  router.post('/pat', (req, res) => {
    const pet = syncPet(req.user.id);
    const now = clock();
    let gained = 0;
    if (now - pet.last_pat_at >= cfg.pat.cooldownMs) {
      const before = pet.joy;
      pet.joy = Math.min(100, pet.joy + cfg.pat.gain);
      gained = Math.round(pet.joy - before);
      pet.last_pat_at = now;
    }
    persist(pet);
    res.json(snapshot(req.user.id, pet, { gained }));
  });

  return router;
}

export { HttpError };
