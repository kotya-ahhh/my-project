import { C } from './Pet.jsx';

/**
 * Иконки в одном стиле с питомцем: плоская заливка + тёмный контур.
 * Единый вид: viewBox 48×48, контур 3px.
 */
const LINE = { stroke: C.ink, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };
const P = {
  red: '#EE8088',
  orange: '#FFB55E',
  green: '#8ACB88',
  yellow: '#F7CF5B',
  yellowDeep: '#D9A93A',
  crust: '#E8B36A',
  cream: '#FFE3E6',
  peri: '#A9B5E6',
  glass: '#EAF4FC',
  rock: '#A8A29D',
  boot: '#B98A62',
  water: '#9CC4EE',
};

const shapes = {
  // ——— еда ———
  apple: (
    <g {...LINE}>
      <path d="M24 15 C16 10 8 16 9 27 C10 38 17 43 24 40 C31 43 38 38 39 27 C40 16 32 10 24 15Z" fill={P.red} />
      <path d="M24 15 C24 10 26 7 30 6" fill="none" />
      <path d="M27 10 C31 4 39 6 39 6 C38 12 32 14 27 10Z" fill={P.green} />
      <path d="M14 26 C14 22 16 20 18 19" fill="none" stroke="#fff" />
    </g>
  ),
  orange: (
    <g {...LINE}>
      <circle cx="24" cy="27" r="15" fill={P.orange} />
      <path d="M24 12 C24 7 27 5 32 5 C32 10 29 13 24 12Z" fill={P.green} />
      <path d="M14 25 C14 21 16 18 19 17" fill="none" stroke="#fff" />
      <circle cx="29" cy="32" r=".6" fill={C.ink} />
      <circle cx="21" cy="34" r=".6" fill={C.ink} />
      <circle cx="31" cy="24" r=".6" fill={C.ink} />
    </g>
  ),
  chips: (
    <g {...LINE}>
      <path d="M10 8 L38 8 L36 42 L12 42 Z" fill={P.yellow} />
      <path d="M9 7 h30 v6 h-30z" fill={P.orange} />
      <path d="M12 38 h24 v4 h-24z" fill={P.orange} />
      <rect x="17" y="18" width="14" height="14" rx="5" fill={P.red} />
      <path d="M20 25 q4 -6 8 0 q-4 6 -8 0z" fill={P.yellow} strokeWidth="2" />
    </g>
  ),
  pizza: (
    <g {...LINE}>
      <path d="M6 13 C20 4 34 4 42 13 L24 44 Z" fill="#FFD86B" />
      <path d="M5 12 C20 2 36 2 43 12 L40 18 C34 10 17 10 8 18 Z" fill={P.crust} />
      <circle cx="21" cy="24" r="3.6" fill={P.red} strokeWidth="2" />
      <circle cx="29" cy="22" r="3.2" fill={P.red} strokeWidth="2" />
      <circle cx="24.5" cy="33" r="3.2" fill={P.red} strokeWidth="2" />
    </g>
  ),
  // ——— лекарства ———
  hunger_med: (
    <g {...LINE}>
      <rect x="18" y="3" width="12" height="6" rx="2" fill={P.crust} />
      <path d="M20 9 h8 v7 C38 20 41 30 38 37 C35 44 13 44 10 37 C7 30 10 20 20 16 Z" fill={P.glass} />
      <path d="M11.5 31 C15 28 33 34 36.5 31 C37 33 37 36 35.5 38.5 C31 43 17 43 12.5 38.5 C11 36 11 33 11.5 31Z" fill={P.orange} stroke="none" />
      <path d="M20 9 h8 v7 C38 20 41 30 38 37 C35 44 13 44 10 37 C7 30 10 20 20 16 Z" fill="none" />
      <g fill="#fff" strokeWidth="2">
        <rect x="19" y="34" width="10" height="3.6" rx="1.8" />
        <circle cx="19" cy="34.6" r="2" /><circle cx="19" cy="37.4" r="2" />
        <circle cx="29" cy="34.6" r="2" /><circle cx="29" cy="37.4" r="2" />
      </g>
    </g>
  ),
  sleep_med: (
    <g {...LINE}>
      <rect x="18" y="3" width="12" height="6" rx="2" fill={P.crust} />
      <path d="M20 9 h8 v7 C38 20 41 30 38 37 C35 44 13 44 10 37 C7 30 10 20 20 16 Z" fill={P.glass} />
      <path d="M11.5 31 C15 28 33 34 36.5 31 C37 33 37 36 35.5 38.5 C31 43 17 43 12.5 38.5 C11 36 11 33 11.5 31Z" fill={P.peri} stroke="none" />
      <path d="M20 9 h8 v7 C38 20 41 30 38 37 C35 44 13 44 10 37 C7 30 10 20 20 16 Z" fill="none" />
      <path d="M27 31 a6 6 0 1 0 4 9 a5 5 0 0 1 -4 -9z" fill="#fff" strokeWidth="2" />
    </g>
  ),
  box: (
    <g {...LINE}>
      <rect x="7" y="18" width="34" height="24" rx="4" fill={P.cream} />
      <rect x="5" y="11" width="38" height="9" rx="3" fill={P.peri} />
      <path d="M24 11 v31" />
      <path d="M24 11 C20 3 12 4 15 9 M24 11 C28 3 36 4 33 9" fill="none" />
    </g>
  ),
  // ——— для мини-игры (несъедобное) ———
  rock: (
    <g {...LINE}>
      <path d="M7 37 C5 27 11 17 21 15 C32 12 43 20 42 32 C41 40 34 43 24 43 C14 43 8 41 7 37Z" fill={P.rock} />
      <path d="M22 22 l4 5 l-3 4" fill="none" strokeWidth="2.5" />
      <path d="M13 26 C14 23 16 21 18 20" fill="none" stroke="#fff" />
    </g>
  ),
  boot: (
    <g {...LINE}>
      <path d="M14 6 h14 v18 c0 4 6 6 12 9 c3 2 3 8 0 9 H9 c-3 0 -3 -4 -2 -6 L14 24Z" fill={P.boot} />
      <path d="M8 36 H41" fill="none" />
      <path d="M14 12 h14 M14 17 h14" fill="none" strokeWidth="2.5" />
      <rect x="14" y="6" width="14" height="5" fill="#8B6440" />
    </g>
  ),
  // ——— монета, сердечки ———
  coin: (
    <g {...LINE}>
      <circle cx="24" cy="24" r="19" fill={P.yellow} />
      <circle cx="24" cy="24" r="13" fill="none" stroke={P.yellowDeep} strokeWidth="2.5" />
      <g fill={P.yellowDeep} stroke="none">
        <ellipse cx="24" cy="28" rx="6" ry="4.5" />
        <ellipse cx="16.5" cy="22" rx="2.3" ry="3" />
        <ellipse cx="21" cy="17.5" rx="2.3" ry="3" />
        <ellipse cx="27" cy="17.5" rx="2.3" ry="3" />
        <ellipse cx="31.5" cy="22" rx="2.3" ry="3" />
      </g>
    </g>
  ),
  // ——— действия ———
  bowl: (
    <g {...LINE}>
      <g fill={P.crust} strokeWidth="2.5">
        <circle cx="15" cy="20" r="4.5" /><circle cx="24" cy="16" r="4.5" /><circle cx="33" cy="20" r="4.5" />
      </g>
      <path d="M5 24 h38 c0 12 -8 19 -19 19 s-19 -7 -19 -19Z" fill={P.yellow} />
      <path d="M13 31 C14 34 16 36 19 37" fill="none" stroke="#fff" />
    </g>
  ),
  shower: (
    <g {...LINE}>
      <path d="M6 20 a18 13 0 0 1 36 0 Z" fill={P.glass} />
      <g fill={P.water} strokeWidth="2.5">
        <path d="M13 26 c-3 5 -3 8 0 8 s3 -3 0 -8Z" />
        <path d="M24 28 c-3 5 -3 8 0 8 s3 -3 0 -8Z" />
        <path d="M35 26 c-3 5 -3 8 0 8 s3 -3 0 -8Z" />
        <path d="M18 38 c-2 3 -2 5 0 5 s2 -2 0 -5Z" />
        <path d="M30 38 c-2 3 -2 5 0 5 s2 -2 0 -5Z" />
      </g>
    </g>
  ),
  moon: (
    <g {...LINE}>
      <path d="M31 6 A18 18 0 1 0 42 32 A15 15 0 0 1 31 6Z" fill={P.yellow} />
      <path d="M38 9 l1.6 3.4 l3.6 .5 l-2.6 2.6 l.6 3.6 l-3.2 -1.7 l-3.2 1.7 l.6 -3.6 l-2.6 -2.6 l3.6 -.5Z" fill="#fff" strokeWidth="2" />
    </g>
  ),
  broom: (
    <g {...LINE}>
      <path d="M38 5 L20 27" fill="none" strokeWidth="4" />
      <path d="M15 25 L25 33 L14 44 C10 44 6 42 4 38 Z" fill={P.crust} />
      <path d="M12 32 l6 5 M8 36 l5 4" fill="none" strokeWidth="2.5" />
      <path d="M15 25 L25 33" />
    </g>
  ),
  paw: (
    <g {...LINE}>
      <path d="M24 24 c-7 0 -12 6 -12 11 c0 5 5 6 12 6 s12 -1 12 -6 c0 -5 -5 -11 -12 -11Z" fill={P.cream} />
      <g fill={P.cream}>
        <ellipse cx="11" cy="22" rx="4" ry="5.5" transform="rotate(-20 11 22)" />
        <ellipse cx="19" cy="13" rx="4" ry="5.5" transform="rotate(-6 19 13)" />
        <ellipse cx="29" cy="13" rx="4" ry="5.5" transform="rotate(6 29 13)" />
        <ellipse cx="37" cy="22" rx="4" ry="5.5" transform="rotate(20 37 22)" />
      </g>
    </g>
  ),
  // ——— навигация ———
  home: (
    <g {...LINE}>
      <path d="M8 23 L24 9 L40 23 V39 a3 3 0 0 1 -3 3 H11 a3 3 0 0 1 -3 -3Z" fill={P.cream} />
      <rect x="19" y="27" width="10" height="15" rx="2" fill={P.peri} />
      <path d="M4 25 L24 6 L44 25" fill="none" strokeWidth="4" />
    </g>
  ),
  gamepad: (
    <g {...LINE}>
      <rect x="4" y="13" width="40" height="24" rx="12" fill={P.peri} />
      <path d="M15 20 v10 M10 25 h10" fill="none" strokeWidth="3.5" />
      <circle cx="32" cy="22" r="3" fill={P.cream} />
      <circle cx="38" cy="28" r="3" fill={P.red} />
    </g>
  ),
  shop: (
    <g {...LINE}>
      <path d="M17 17 v-4 a7 7 0 0 1 14 0 v4" fill="none" />
      <path d="M8 17 h32 l3 25 H5Z" fill={P.yellow} />
      <path d="M19 27 q5 6 10 0" fill="none" />
    </g>
  ),
  backpack: (
    <g {...LINE}>
      <path d="M18 9 a6 6 0 0 1 12 0" fill="none" />
      <rect x="9" y="9" width="30" height="34" rx="11" fill={P.peri} />
      <rect x="15" y="27" width="18" height="12" rx="4" fill={P.cream} />
      <path d="M9 22 h30" fill="none" />
    </g>
  ),
  logout: (
    <g {...LINE}>
      <path d="M20 6 H9 a3 3 0 0 0 -3 3 v30 a3 3 0 0 0 3 3 h11" fill={P.cream} />
      <path d="M18 24 h24 M34 15 l9 9 l-9 9" fill="none" strokeWidth="4" />
    </g>
  ),
  close: (
    <g {...LINE}>
      <path d="M12 12 L36 36 M36 12 L12 36" fill="none" strokeWidth="5" />
    </g>
  ),
  plus: (
    <g {...LINE}>
      <path d="M24 10 V38 M10 24 H38" fill="none" strokeWidth="5" />
    </g>
  ),
  minus: (
    <g {...LINE}>
      <path d="M10 24 H38" fill="none" strokeWidth="5" />
    </g>
  ),
  check: (
    <g {...LINE}>
      <path d="M10 25 L20 35 L38 13" fill="none" strokeWidth="5" />
    </g>
  ),
  drop: (
    <g {...LINE}>
      <path d="M24 6 C14 20 10 26 10 32 a14 12 0 0 0 28 0 C38 26 34 20 24 6Z" fill={P.glass} />
      <path d="M17 32 C17 35 19 37 22 38" fill="none" stroke="#fff" />
    </g>
  ),
};

export const ICON_NAMES = Object.keys(shapes);

export function Icon({ name, size = 32, className = '', title }) {
  const shape = shapes[name] ?? shapes.box;
  return (
    <svg
      className={`icon icon--${name} ${className}`}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {shape}
    </svg>
  );
}

/** Иконка товара по его коду из каталога (неизвестный код — коробка). */
export const ItemIcon = ({ code, ...rest }) => <Icon name={shapes[code] ? code : 'box'} {...rest} />;

/** Пиксельное сердечко — фирменный акцент из логотипа. */
const HEART_ROWS = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'];
export function PixelHeart({ size = 24, empty = false, className = '' }) {
  const fill = empty ? '#EBDCDE' : '#E58A96';
  const edge = empty ? '#C9B5B8' : '#B9606D';
  const cells = HEART_ROWS.flatMap((row, y) => [...row].map((c, x) => (c === '1' ? [x, y] : null)).filter(Boolean));
  return (
    <svg
      className={`pixel-heart ${className}`}
      viewBox="-0.5 -0.5 9 8"
      width={size}
      height={(size * 8) / 9}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {/* сначала тёмная «обводка», затем заливка */}
      {cells.map(([x, y]) => (
        <rect key={`o${x}-${y}`} x={x - 0.3} y={y - 0.3} width="1.6" height="1.6" fill={edge} />
      ))}
      {cells.map(([x, y]) => (
        <rect key={`f${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />
      ))}
      {!empty && (
        <g fill="#FFD3D8">
          <rect x="1" y="1" width="2" height="1" />
          <rect x="1" y="2" width="1" height="1" />
        </g>
      )}
    </svg>
  );
}

/** Куча (след жизнедеятельности) на полу комнаты. */
export function Waste({ className = '' }) {
  return (
    <svg className={`waste ${className}`} viewBox="0 0 48 44" aria-hidden="true" focusable="false">
      <g {...LINE} fill="#9A7358">
        <path d="M6 38 C4 30 12 26 24 26 C36 26 44 30 42 38 C40 42 30 42 24 42 C18 42 8 42 6 38Z" />
        <path d="M11 27 C10 20 16 16 24 16 C32 16 38 20 37 27 Z" />
        <path d="M17 17 C17 11 21 8 25 5 C26 10 32 11 31 17 Z" />
      </g>
      <path d="M15 34 C17 31 20 30 23 30" fill="none" stroke="#C7A184" strokeWidth="3" strokeLinecap="round" />
      <g fill={C.ink}>
        <circle cx="18" cy="21" r="1.6" />
        <circle cx="28" cy="21" r="1.6" />
      </g>
    </svg>
  );
}
