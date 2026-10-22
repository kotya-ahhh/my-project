// Логика мини-игры «Лови еду» — без DOM. Координаты нормированы: x, y ∈ [0, 1].
export const FOODS = ['apple', 'orange', 'chips', 'pizza'];
export const BADS = ['rock', 'boot'];

/** Поле фиксированных пропорций 3:4 (ширина / высота). */
export const ASPECT = 3 / 4;
export const ITEM_W = 0.14; // ширина предмета — доля ширины поля
export const CATCHER_W = 0.26;

const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class GameEngine {
  constructor({ durationSec, lives }) {
    this.duration = durationSec;
    this.time = durationSec;
    this.lives = lives;
    this.caught = 0;
    this.items = [];
    this.playerX = 0.5;
    this.spawnIn = 0.6;
    this.nextId = 1;
    this.finished = false;
  }

  get score() { return this.caught * 10; }

  /** Продвигает игру на dt секунд. Возвращает события для звука/анимации и признак смены набора предметов. */
  update(dt) {
    const events = [];
    let changed = false;
    if (this.finished) return { events, changed };

    this.time = Math.max(0, this.time - dt);
    const progress = 1 - this.time / this.duration;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const bad = Math.random() < lerp(0.28, 0.4, progress);
      this.items.push({
        id: this.nextId++,
        kind: bad ? 'bad' : 'food',
        code: pick(bad ? BADS : FOODS),
        x: 0.09 + Math.random() * 0.82,
        y: -0.08,
        vy: lerp(0.3, 0.52, progress) * (0.92 + Math.random() * 0.2),
        spin: (Math.random() - 0.5) * 60,
        rot: 0,
      });
      this.spawnIn = lerp(0.95, 0.58, progress) * (0.85 + Math.random() * 0.3);
      changed = true;
    }

    const keep = [];
    for (const it of this.items) {
      it.y += it.vy * dt;
      it.rot += it.spin * dt;
      const inMouthRow = it.y > 0.8 && it.y < 0.95;
      const inMouthCol = Math.abs(it.x - this.playerX) < CATCHER_W / 2 + ITEM_W * 0.15;
      if (inMouthRow && inMouthCol) {
        changed = true;
        if (it.kind === 'food') {
          this.caught += 1;
          events.push({ type: 'caught', item: it });
        } else {
          this.lives -= 1;
          events.push({ type: 'hit', item: it });
        }
        continue;
      }
      if (it.y > 1.1) { changed = true; continue; }
      keep.push(it);
    }
    this.items = keep;

    if (this.time <= 0 || this.lives <= 0) this.finished = true;
    return { events, changed };
  }
}
