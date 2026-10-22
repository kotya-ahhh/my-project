import { Icon, PixelHeart } from './Icons.jsx';
import { STATS } from '../utils.js';

const LOW = 20;

export default function StatBars({ pet, className = '' }) {
  return (
    <section className={`stats ${className}`} aria-label="Состояние Майнула">
      {STATS.map((s) => {
        const value = pet ? pet[s.key] : 0;
        const low = pet && value < LOW;
        return (
          <div key={s.key} className={`stat ${low ? 'stat--low' : ''}`} style={{ '--c': s.color }}>
            <div className="stat-top">
              {s.icon === 'heart' ? <PixelHeart size={26} /> : <Icon name={s.icon} size={26} />}
              <span className="stat-name">{s.label}</span>
              <span className="stat-val">{pet ? `${value}%` : '—'}</span>
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-label={s.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-valuetext={`${value}%${low ? ', очень мало' : ''}`}
            >
              <i style={{ width: `${value}%` }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
