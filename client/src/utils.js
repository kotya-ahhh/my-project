/** Склонение по числу: plural(3, 'монета', 'монеты', 'монет') → «монеты». */
export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export const STATS = [
  { key: 'hunger', label: 'Сытость', icon: 'bowl', color: 'var(--orange)' },
  { key: 'cleanliness', label: 'Чистота', icon: 'drop', color: 'var(--sky)' },
  { key: 'sleep', label: 'Сон', icon: 'moon', color: 'var(--peri-deep)' },
  { key: 'joy', label: 'Радость', icon: 'heart', color: 'var(--rose)' },
];

export const STAT_LABEL = { hunger: 'сытости', sleep: 'сна' };
