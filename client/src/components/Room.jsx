import { useEffect, useState } from 'react';
import { PixelHeart, Waste } from './Icons.jsx';

const SLOTS = [
  { left: '7%', bottom: '3%' },
  { left: '42%', bottom: '0.5%' },
  { left: '77%', bottom: '4%' },
];

/** Комната: стена, окно, плакат с пиксельным сердцем, ковёр, следы жизнедеятельности. */
export default function Room({ night, wasteCount, onCleanWaste, say, children }) {
  // Какие из трёх «мест» на полу заняты. Нажатый след пропадает сразу, не дожидаясь сервера.
  const [slots, setSlots] = useState([false, false, false]);

  useEffect(() => {
    setSlots((cur) => {
      const next = [...cur];
      let have = next.filter(Boolean).length;
      for (let i = 0; have < wasteCount && i < 3; i++) if (!next[i]) { next[i] = true; have++; }
      for (let i = 2; have > wasteCount && i >= 0; i--) if (next[i]) { next[i] = false; have--; }
      return next;
    });
  }, [wasteCount]);

  const clean = (i) => {
    setSlots((cur) => cur.map((v, idx) => (idx === i ? false : v)));
    onCleanWaste();
  };

  return (
    <div className={`room ${night ? 'room--night' : ''}`}>
      <div className="room-wall" />
      <div className="room-floor" />
      <div className="room-base" />
      <div className="room-window" aria-hidden="true">
        <span className="room-cloud" />
        <span className="room-moon" />
        <span className="room-stars" />
      </div>
      <div className="room-poster" aria-hidden="true">
        <PixelHeart size={34} />
      </div>
      <div className="room-rug" />

      {children}

      {slots.map((on, i) =>
        on ? (
          <button
            key={i}
            className="waste-btn"
            style={SLOTS[i]}
            onClick={() => clean(i)}
            aria-label="Убрать след"
            title="Убрать"
          >
            <Waste />
          </button>
        ) : null,
      )}

      {say && (
        <div className="bubble" role="status">
          {say}
        </div>
      )}
      <div className="room-night" aria-hidden="true" />
    </div>
  );
}
