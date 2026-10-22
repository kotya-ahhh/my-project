import { GAME } from './config.js';

const clamp = (v) => Math.min(100, Math.max(0, v));
const HOUR_MS = 3_600_000;
const STEP_H = 0.1; // шаг симуляции — 6 игровых минут

/** Шкала «заполнена» — то же, что пользователь видит как 100%. */
export const isFull = (v) => v >= 99.5;

/**
 * «Ленивое» обновление: питомец живёт и пока вкладка закрыта.
 * Считаем, что прошло elapsedMs, и по шагам применяем убывание,
 * сон, следы жизнедеятельности. Чистая функция — БД не трогает.
 */
export function advance(pet, elapsedMs, cfg = GAME) {
  const p = { ...pet };
  let remaining = Math.min((Math.max(0, elapsedMs) / HOUR_MS) * cfg.timeScale, cfg.maxCatchUpHours);

  while (remaining > 1e-9) {
    if (p.is_sleeping && p.sleep >= 100) p.is_sleeping = 0;

    let h = Math.min(STEP_H, remaining);
    let wakesUp = false;
    if (p.is_sleeping) {
      const need = (100 - p.sleep) / cfg.sleepGainPerHour;
      if (need <= h) {
        h = need;
        wakesUp = true;
      }
    }

    const k = p.is_sleeping ? cfg.sleepDecayFactor : 1;
    const waste = p.waste_count;
    const lowCount = [p.hunger, p.cleanliness, p.sleep].filter((v) => v < cfg.lowThreshold).length;

    p.hunger = clamp(p.hunger - cfg.decayPerHour.hunger * k * h);
    p.cleanliness = clamp(
      p.cleanliness - (cfg.decayPerHour.cleanliness * k + cfg.wastePenaltyPerHour.cleanliness * waste) * h,
    );
    p.joy = clamp(
      p.joy -
        (cfg.decayPerHour.joy * k + cfg.wastePenaltyPerHour.joy * waste + cfg.lowStatJoyPenaltyPerHour * lowCount) * h,
    );

    if (p.is_sleeping) {
      p.sleep = wakesUp ? 100 : clamp(p.sleep + cfg.sleepGainPerHour * h);
      if (wakesUp) p.is_sleeping = 0;
    } else {
      p.sleep = clamp(p.sleep - cfg.decayPerHour.sleep * h);
      // Следы появляются только у бодрствующего питомца
      if (p.waste_count < cfg.wasteMax) {
        p.waste_progress += h;
        while (p.waste_progress >= cfg.wasteIntervalHours && p.waste_count < cfg.wasteMax) {
          p.waste_progress -= cfg.wasteIntervalHours;
          p.waste_count += 1;
        }
      }
      if (p.waste_count >= cfg.wasteMax) p.waste_progress = 0;
    }

    remaining -= h;
  }
  return p;
}

/** Настроение — что рисовать: приоритет голод > сон > грусть. */
export function moodOf(p, cfg = GAME) {
  if (p.is_sleeping) return 'sleeping';
  const low = cfg.lowThreshold;
  if (p.hunger < low) return 'hungry';
  if (p.sleep < low) return 'sleepy';
  if (p.joy < low) return 'sad';
  const avg = (p.hunger + p.cleanliness + p.sleep + p.joy) / 4;
  return p.joy >= 60 && avg >= 60 ? 'happy' : 'neutral';
}

export function serializePet(p, cfg = GAME) {
  return {
    name: p.name,
    hunger: Math.round(p.hunger),
    cleanliness: Math.round(p.cleanliness),
    sleep: Math.round(p.sleep),
    joy: Math.round(p.joy),
    wasteCount: p.waste_count,
    isSleeping: p.is_sleeping === 1,
    isDirty: p.cleanliness < cfg.lowThreshold,
    mood: moodOf(p, cfg),
  };
}
