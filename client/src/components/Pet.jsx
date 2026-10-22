import { useId } from 'react';

/**
 * Майнул, нарисованный в SVG в стиле иконки: плоские заливки, толстый тёмный контур,
 * пятна на лбу, полосатые щёки, розовые «зигзаги» румянца и сердечко на языке.
 * Все состояния (настроение / действие) собираются из одних и тех же деталей.
 */
export const C = {
  ink: '#221E1D',
  fur: '#D8D3CD',
  furLight: '#ECE8E3',
  spot: '#544F49',
  blush: '#D28289',
  white: '#FFFEFD',
  earLine: '#8C8783',
  mouth: '#0D0B0B',
  peri: '#B4BDDE',
  egg: '#D5EAFB',
  water: '#9CC4EE',
};

// Один шип-«вихор» на макушке и два острых пучка шерсти на щеках (не отдельная графика,
// а часть силуэта головы) — рисунок линии по новому референсу.
const HEAD_PATH =
  'M200 50 L176 84 ' +
  'C130 100 86 118 74 150 C64 168 64 176 62 188 ' +
  'L18 168 L56 200 L14 226 L58 236 ' +
  'C70 254 96 274 140 284 C168 298 232 298 260 284 ' +
  'C304 274 330 254 342 236 L386 226 L344 200 L382 168 L338 188 ' +
  'C336 176 336 168 326 150 C314 118 270 100 224 84 Z';

/** Настроение/действие → набор черт лица. */
const FACES = {
  happy: { eyes: 'round', mouth: 'cat', blush: 1 },
  neutral: { eyes: 'round', mouth: 'cat', blush: 0 },
  hungry: { eyes: 'puppy', brows: 'worry', mouth: 'small', blush: 0, drool: true },
  sad: { eyes: 'round', brows: 'sad', mouth: 'frown', blush: 0, tear: true },
  sleepy: { eyes: 'half', mouth: 'yawn', blush: 0.5 },
  sleeping: { eyes: 'closed', mouth: 'cat', blush: 0.9 },
  eating: { eyes: 'arc', mouth: 'chew', blush: 1 },
  petted: { eyes: 'closed', mouth: 'open', blush: 1, bigBlush: true },
  washing: { eyes: 'squeeze', mouth: 'open', blush: 1 },
};

function Eyes({ kind }) {
  const xs = [152, 248];
  switch (kind) {
    case 'arc':
    case 'squeeze':
      return (
        <g className="pet-eyes" fill="none" stroke={C.ink} strokeWidth="10" strokeLinecap="round">
          <path d="M132 186 Q152 158 172 186" />
          <path d="M228 186 Q248 158 268 186" />
        </g>
      );
    case 'closed':
      return (
        <g fill="none" stroke={C.ink} strokeWidth="9" strokeLinecap="round">
          <path d="M134 174 Q152 194 170 174" />
          <path d="M230 174 Q248 194 266 174" />
        </g>
      );
    case 'half':
      return (
        <g>
          {xs.map((x) => (
            <g key={x}>
              <path d={`M${x - 16} 174 H${x + 16} A16 16 0 0 1 ${x - 16} 174 Z`} fill={C.ink} />
              <circle cx={x - 4} cy="181" r="4" fill={C.white} />
            </g>
          ))}
        </g>
      );
    case 'puppy':
      return (
        <g className="pet-eyes pet-blink">
          {xs.map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="176" rx="17" ry="20" fill={C.ink} />
              <circle cx={x - 5} cy="168" r="6.5" fill={C.white} />
              <circle cx={x + 6} cy="184" r="3.2" fill={C.white} />
            </g>
          ))}
        </g>
      );
    default: // round — просто круглые глаза с бликом
      return (
        <g className="pet-eyes pet-blink">
          {xs.map((x) => (
            <g key={x}>
              <circle cx={x} cy="178" r="12" fill={C.ink} />
              <circle cx={x - 4} cy="173" r="4" fill={C.white} />
            </g>
          ))}
        </g>
      );
  }
}

function Brows({ kind }) {
  if (!kind) return null;
  const sad = kind === 'sad';
  return (
    <g fill="none" stroke={C.ink} strokeWidth="7" strokeLinecap="round">
      <path d={sad ? 'M130 150 L168 136' : 'M132 148 L166 138'} />
      <path d={sad ? 'M232 136 L270 150' : 'M234 138 L268 148'} />
    </g>
  );
}

function Mouth({ kind }) {
  const tongue = (y, s = 1) => (
    <path
      transform={`translate(200 ${y}) scale(${s}) translate(-200 -250)`}
      d="M188 248 C188 241 199 241 200 247 C201 241 212 241 212 248 C212 256 200 260 200 260 C200 260 188 256 188 248 Z"
      fill={C.blush}
    />
  );
  switch (kind) {
    case 'open':
    case 'chew': {
      const body = (
        <g>
          <path
            d="M170 216 C178 226 222 226 230 216 C230 250 214 268 200 268 C186 268 170 250 170 216 Z"
            fill={C.mouth}
            stroke={C.ink}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M177 222 L190 227 L182 240 Z" fill={C.white} />
          <path d="M223 222 L210 227 L218 240 Z" fill={C.white} />
          {tongue(250)}
        </g>
      );
      return kind === 'chew' ? <g className="pet-chew">{body}</g> : body;
    }
    case 'small':
      return (
        <g>
          <ellipse cx="200" cy="236" rx="10" ry="12" fill={C.mouth} stroke={C.ink} strokeWidth="4" />
          <path d="M194 240 Q200 246 206 240" stroke={C.blush} strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'frown':
      return <path d="M182 240 Q200 222 218 240" fill="none" stroke={C.ink} strokeWidth="5.5" strokeLinecap="round" />;
    case 'yawn':
      return (
        <g className="pet-yawn">
          <ellipse cx="200" cy="240" rx="15" ry="19" fill={C.mouth} stroke={C.ink} strokeWidth="4" />
          <ellipse cx="200" cy="252" rx="9" ry="6" fill={C.blush} />
        </g>
      );
    default: // cat "w"
      return (
        <path
          d="M180 218 Q190 232 200 218 Q210 232 220 218"
          fill="none"
          stroke={C.ink}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}

/** Голова целиком: уши, пятна, щёки, лицо. `face` — ключ из FACES. */
export function Head({ face = 'happy', uid }) {
  const f = FACES[face] ?? FACES.happy;
  const clip = `head-${uid}`;
  const blushOpacity = f.blush ?? 0;
  const blushW = f.bigBlush ? 7 : 5.5;

  const cheek = (
    <g fill={C.spot}>
      <rect x="58" y="206" width="60" height="13" rx="6.5" />
      <rect x="64" y="230" width="50" height="12" rx="6" />
    </g>
  );
  const zig = (
    <path
      transform="translate(9 -5)"
      d="M112 206 l32 -4 l-23 10 l31 -5"
      fill="none"
      stroke={C.blush}
      strokeWidth={blushW}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const ear = (
    <g className="pet-ear">
      <path
        d="M94 146 C46 134 32 76 76 46 C104 27 148 40 154 84 C158 114 144 136 118 147 C109 151 101 150 94 146 Z"
        fill={C.spot}
        stroke={C.ink}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M112 138 C88 130 82 104 96 86 C106 74 120 82 122 100 C124 118 128 132 112 138 Z"
        fill={C.earLine}
        stroke="#75716D"
        strokeWidth="2.5"
      />
    </g>
  );

  return (
    <g className="pet-head-parts" transform="translate(200 174) scale(0.82) translate(-200 -174)">
      <clipPath id={clip}>
        <path d={HEAD_PATH} />
      </clipPath>

      <g className="pet-ear-l">{ear}</g>
      <g transform="translate(400 0) scale(-1 1)">
        <g className="pet-ear-r">{ear}</g>
      </g>

      <path d={HEAD_PATH} fill={C.fur} stroke={C.ink} strokeWidth="9" strokeLinejoin="round" />

      <g clipPath={`url(#${clip})`}>
        {/* два круглых пятна на лбу — как на референсе, без лишних разводов */}
        <circle cx="182" cy="120" r="14" fill={C.spot} stroke="#3B3633" strokeWidth="4" />
        <circle cx="238" cy="124" r="14" fill={C.spot} stroke="#3B3633" strokeWidth="4" />
        {/* сплошные усы-полоски на щеках */}
        {cheek}
        <g transform="translate(400 0) scale(-1 1)">{cheek}</g>
      </g>

      {blushOpacity > 0 && (
        <g opacity={blushOpacity}>
          {zig}
          <g transform="translate(400 0) scale(-1 1)">{zig}</g>
        </g>
      )}

      <Eyes kind={f.eyes} />
      <Brows kind={f.brows} />

      {/* нос-сердечко, компактный — как маленький акцент на референсе */}
      <path
        d="M193 202 C193 197 200 197 200 201 C200 197 207 197 207 202 C207 207 200 211 200 211 C200 211 193 207 193 202 Z"
        fill={C.ink}
      />
      <Mouth kind={f.mouth} />

      {f.tear && (
        <path
          className="pet-tear"
          d="M270 196 C262 208 262 216 270 216 C278 216 278 208 270 196 Z"
          fill={C.water}
          stroke={C.ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      {f.drool && (
        <path
          className="pet-tear"
          d="M216 246 C210 256 210 262 216 262 C222 262 222 256 216 246 Z"
          fill={C.water}
          stroke={C.ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

function Paw({ x }) {
  return (
    <g>
      <ellipse cx={x} cy="378" rx="38" ry="27" fill={C.fur} stroke={C.ink} strokeWidth="7" />
      <ellipse cx={x - 14} cy="368" rx="6" ry="4.5" fill={C.spot} />
      <ellipse cx={x + 8} cy="365" rx="5" ry="4" fill={C.spot} />
      <ellipse cx={x + 20} cy="376" rx="5" ry="4" fill={C.spot} />
      <path d={`M${x - 8} 388 v11 M${x + 8} 388 v11`} stroke={C.ink} strokeWidth="4.5" strokeLinecap="round" />
    </g>
  );
}

function Bubbles() {
  const list = [
    [120, 120, 16, 0], [292, 110, 12, 0.3], [90, 230, 14, 0.6], [318, 236, 18, 0.15],
    [160, 330, 15, 0.45], [262, 340, 13, 0.75], [200, 60, 12, 0.9], [140, 190, 9, 1.05], [270, 200, 10, 0.5],
  ];
  return (
    <g className="pet-bubbles">
      {list.map(([x, y, r, d], i) => (
        <g key={i} className="pet-bubble" style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` }}>
          <circle cx={x} cy={y} r={r} fill="rgba(213,234,251,.75)" stroke="#7FA5D6" strokeWidth="3" />
          <path d={`M${x - r * 0.5} ${y - r * 0.15} A${r * 0.55} ${r * 0.55} 0 0 1 ${x} ${y - r * 0.55}`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Foam() {
  const blobs = [[170, 76, 22], [204, 66, 26], [238, 76, 22], [186, 96, 18], [224, 96, 18]];
  return (
    <g className="pet-foam" stroke={C.ink} strokeWidth="5" fill={C.white}>
      {blobs.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} />
      ))}
      {blobs.map(([x, y, r], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r - 2.5} stroke="none" />
      ))}
    </g>
  );
}

function Dirt() {
  return (
    <g>
      <g fill="#8A6F5A" opacity=".6">
        <ellipse cx="132" cy="142" rx="15" ry="8" transform="rotate(-20 132 142)" />
        <ellipse cx="282" cy="118" rx="12" ry="7" transform="rotate(25 282 118)" />
        <ellipse cx="238" cy="258" rx="14" ry="7" />
        <ellipse cx="150" cy="322" rx="17" ry="9" transform="rotate(15 150 322)" />
        <ellipse cx="262" cy="336" rx="13" ry="8" transform="rotate(-25 262 336)" />
      </g>
      <g className="pet-stink" fill="none" stroke="#9BBF7A" strokeWidth="5" strokeLinecap="round">
        <path d="M120 44 q-10 -14 0 -26 q10 -12 0 -24" />
        <path d="M200 30 q-10 -14 0 -26 q10 -12 0 -24" style={{ animationDelay: '.4s' }} />
        <path d="M282 44 q-10 -14 0 -26 q10 -12 0 -24" style={{ animationDelay: '.8s' }} />
      </g>
      <g className="pet-flies">
        <g className="pet-fly">
          <circle cx="312" cy="96" r="5" fill={C.ink} />
          <ellipse cx="308" cy="90" rx="6" ry="3" fill="rgba(255,255,255,.85)" stroke={C.ink} strokeWidth="1.5" />
        </g>
        <g className="pet-fly pet-fly-2">
          <circle cx="96" cy="112" r="5" fill={C.ink} />
          <ellipse cx="92" cy="106" rx="6" ry="3" fill="rgba(255,255,255,.85)" stroke={C.ink} strokeWidth="1.5" />
        </g>
      </g>
    </g>
  );
}

function Zzz() {
  return (
    <g className="pet-zzz" fontFamily="Nunito Variable, Nunito, sans-serif" fontWeight="900" fill={C.peri} stroke={C.ink} strokeWidth="3" paintOrder="stroke" strokeLinejoin="round">
      <text x="322" y="88" fontSize="34">Z</text>
      <text x="350" y="56" fontSize="26" style={{ animationDelay: '.7s' }}>z</text>
      <text x="372" y="30" fontSize="20" style={{ animationDelay: '1.4s' }}>z</text>
    </g>
  );
}

function Crumbs() {
  return (
    <g className="pet-crumbs" fill="#E8B36A" stroke={C.ink} strokeWidth="2">
      <circle cx="176" cy="272" r="4" />
      <circle cx="226" cy="278" r="3.5" style={{ animationDelay: '.3s' }} />
      <circle cx="200" cy="286" r="3" style={{ animationDelay: '.6s' }} />
    </g>
  );
}

/**
 * @param mood   'happy' | 'neutral' | 'hungry' | 'sad' | 'sleepy' | 'sleeping'
 * @param action null | 'eating' | 'washing' | 'petted'
 * @param dirty  показывать грязь, мух и запах
 */
export default function Pet({ mood = 'happy', action = null, dirty = false, className = '', title }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const face = action ?? mood;
  const sleeping = mood === 'sleeping' && !action;
  const classes = ['pet', `pet--${mood}`, action && `pet--${action}`, className].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      viewBox="0 0 400 420"
      role="img"
      aria-label={title ?? 'Майнул'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="200" cy="402" rx="128" ry="13" fill="rgba(34,30,29,.14)" />

      {/* хвост с тёмным кончиком */}
      <g className="pet-tail">
        <clipPath id={`tail-${uid}`}>
          <path d="M292 352 C352 374 394 330 380 266 C374 238 348 230 340 250 C352 282 342 318 300 322 Z" />
        </clipPath>
        <path
          d="M292 352 C352 374 394 330 380 266 C374 238 348 230 340 250 C352 282 342 318 300 322 Z"
          fill={C.fur}
        />
        <g clipPath={`url(#tail-${uid})`}>
          <circle cx="352" cy="240" r="24" fill={C.spot} />
          <path d="M318 300 C346 306 372 296 386 280" fill="none" stroke={C.spot} strokeWidth="13" />
        </g>
        <path
          d="M292 352 C352 374 394 330 380 266 C374 238 348 230 340 250 C352 282 342 318 300 322 Z"
          fill="none"
          stroke={C.ink}
          strokeWidth="7"
          strokeLinejoin="round"
        />
      </g>

      {/* тело */}
      <g className="pet-body">
        <path
          d="M92 322 C88 262 138 232 200 232 C262 232 312 262 308 322 C305 368 262 392 200 392 C138 392 95 368 92 322 Z"
          fill={C.fur}
          stroke={C.ink}
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <ellipse cx="200" cy="338" rx="60" ry="42" fill={C.furLight} />
        <ellipse cx="112" cy="312" rx="8" ry="15" transform="rotate(12 112 312)" fill={C.spot} />
        <ellipse cx="290" cy="312" rx="8" ry="15" transform="rotate(-12 290 312)" fill={C.spot} />
        <ellipse cx="124" cy="346" rx="6" ry="10" transform="rotate(20 124 346)" fill={C.spot} />
        <ellipse cx="278" cy="346" rx="6" ry="10" transform="rotate(-20 278 346)" fill={C.spot} />
        <Paw x={150} />
        <Paw x={250} />
      </g>

      <g className="pet-head">
        <Head face={face} uid={uid} />
        {action === 'washing' && <Foam />}
        {action === 'eating' && <Crumbs />}
      </g>

      {dirty && !sleeping && <Dirt />}
      {sleeping && <Zzz />}
      {action === 'washing' && <Bubbles />}
    </svg>
  );
}

/** Только голова, как на иконке — для ловца в мини-игре и мелких «аватарок». */
export function PetHead({ face = 'happy', className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg className={`pet-head-only ${className}`} viewBox="40 40 320 260" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <Head face={face} uid={uid} />
    </svg>
  );
}
