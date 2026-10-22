import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Pet, { PetHead } from '../components/Pet.jsx';
import Room from '../components/Room.jsx';
import Sheet from '../components/Sheet.jsx';
import StatBars from '../components/StatBars.jsx';
import { Icon, ItemIcon, PixelHeart } from '../components/Icons.jsx';

const EAT_MS = 2300;
const WASH_MS = 2700;
const PET_MS = 1300;

/** Что Майнул «говорит» в облачке: сначала действие, потом самая острая потребность. */
function sayFor(pet, action) {
  if (action === 'eating') return 'Ням-ням!';
  if (action === 'washing') return 'Бульк-бульк!';
  if (action === 'petted') return 'Мур-р-р!';
  if (pet.isSleeping) return null;
  if (pet.mood === 'hungry') return 'Я голодный!';
  if (pet.mood === 'sleepy') return 'Хочу спать…';
  if (pet.mood === 'sad') return 'Мне грустно…';
  if (pet.isDirty) return 'Хочу помыться!';
  if (pet.wasteCount > 0) return 'Тут надо убрать!';
  return null;
}

function FeedSheet({ open, onClose, onPick }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setItems(null);
    setError(null);
    api
      .inventory()
      .then((r) => alive && setItems(r.items.filter((i) => i.category === 'food')))
      .catch((e) => alive && setError(e));
    return () => { alive = false; };
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title="Чем покормить Майнула?">
      {error && <p className="form-error">{error.message}</p>}
      {!items && !error && <div className="spinner" role="status" aria-label="Загрузка" />}
      {items?.length === 0 && (
        <div className="state-box" style={{ margin: 0, padding: '8px 0' }}>
          <p>Еды в инвентаре нет. Загляните в магазин: там есть яблоки, чипсы и даже пицца.</p>
          <Link className="btn" to="/shop" onClick={onClose}>
            <Icon name="shop" size={26} /> В магазин
          </Link>
        </div>
      )}
      {items?.map((it) => (
        <button key={it.id} className="pick" onClick={() => onPick(it)}>
          <ItemIcon code={it.code} size={44} />
          <span className="pick-text">
            <b>{it.name}</b>
            <small>Сытость +{it.effectValue}%</small>
          </span>
          <span className="pick-qty">×{it.quantity}</span>
        </button>
      ))}
    </Sheet>
  );
}

export default function HomePage() {
  const { pet, error, applyState, refresh } = usePet();
  const toast = useToast();
  const [action, setAction] = useState(null); // 'eating' | 'washing' | 'petted'
  const [feedOpen, setFeedOpen] = useState(false);
  const [foodItem, setFoodItem] = useState(null);
  const [hearts, setHearts] = useState([]);
  const timers = useRef(new Set());
  const patTimer = useRef(null);
  const lastPatApi = useRef(0);
  const drag = useRef(null);
  const heartId = useRef(0);

  const busy = action === 'eating' || action === 'washing';

  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };
  useEffect(() => {
    const all = timers.current;
    return () => {
      all.forEach(clearTimeout);
      clearTimeout(patTimer.current);
    };
  }, []);

  const fail = (e) => {
    toast(e.message, 'error');
    if (e.status === 409 || e.status === 0) refresh();
  };

  if (!pet) {
    if (error) {
      return (
        <div className="state-box">
          <PetHead face="sad" />
          <h2>Не получилось найти Майнула</h2>
          <p className="muted">{error.message}</p>
          <button className="btn" onClick={refresh}>Повторить</button>
        </div>
      );
    }
    return (
      <div className="state-box" role="status">
        <PetHead face="sleepy" />
        <p className="muted">Майнул потягивается…</p>
      </div>
    );
  }

  const sleepingHint = () => toast('Майнул спит. Сначала разбудите его');

  const openFeed = () => {
    if (busy) return;
    if (pet.isSleeping) return sleepingHint();
    if (pet.hunger >= 100) return toast('Майнул не голоден');
    setFeedOpen(true);
  };

  const feedWith = async (item) => {
    setFeedOpen(false);
    try {
      const res = await api.use(item.id);
      setFoodItem(item);
      setAction('eating');
      later(() => {
        applyState(res);
        setAction(null);
        setFoodItem(null);
        toast(`Сытость +${res.used.delta}%`, 'success');
      }, EAT_MS);
    } catch (e) {
      fail(e);
    }
  };

  const wash = async () => {
    if (busy) return;
    if (pet.isSleeping) return sleepingHint();
    if (pet.cleanliness >= 100) return toast('Майнул и так чистый');
    try {
      const res = await api.wash();
      setAction('washing');
      later(() => {
        applyState(res);
        setAction(null);
        toast('Майнул чистый и пушистый', 'success');
      }, WASH_MS);
    } catch (e) {
      fail(e);
    }
  };

  const toggleSleep = async () => {
    if (busy) return;
    try {
      const res = await api.sleep(!pet.isSleeping);
      applyState(res);
      toast(res.pet.isSleeping ? 'Майнул засыпает…' : 'Майнул проснулся');
    } catch (e) {
      fail(e);
    }
  };

  const cleanOne = async () => {
    try {
      applyState(await api.clean());
    } catch (e) {
      fail(e);
      refresh();
    }
  };

  const cleanButton = () => {
    if (pet.wasteCount === 0) return toast('Убирать нечего: вокруг чисто');
    cleanOne();
  };

  const pat = (point) => {
    if (busy) return;
    if (!pet.isSleeping) {
      setAction('petted');
      clearTimeout(patTimer.current);
      patTimer.current = setTimeout(() => setAction((a) => (a === 'petted' ? null : a)), PET_MS);
    }
    const id = ++heartId.current;
    setHearts((h) => [...h.slice(-4), { id, x: point?.x ?? 50, y: point?.y ?? 30 }]);
    later(() => setHearts((h) => h.filter((x) => x.id !== id)), 1100);

    // На сервер — не чаще раза в секунду; он сам ограничивает начисление радости
    const now = Date.now();
    if (now - lastPatApi.current >= 1000) {
      lastPatApi.current = now;
      api.pat().then(applyState).catch(() => {});
    }
  };

  const pointOf = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const say = sayFor(pet, action);
  const actions = [
    { id: 'feed', icon: 'bowl', short: 'Кормить', long: 'Покормить', onClick: openFeed, off: pet.isSleeping || pet.hunger >= 100 },
    { id: 'wash', icon: 'shower', short: 'Мыть', long: 'Помыть', onClick: wash, off: pet.isSleeping || pet.cleanliness >= 100 },
    {
      id: 'sleep', icon: 'moon',
      short: pet.isSleeping ? 'Будить' : 'Спать',
      long: pet.isSleeping ? 'Разбудить' : 'Уложить спать',
      onClick: toggleSleep, off: false,
    },
    { id: 'clean', icon: 'broom', short: 'Убрать', long: 'Убрать', onClick: cleanButton, off: pet.wasteCount === 0, badge: pet.wasteCount },
    { id: 'pat', icon: 'paw', short: 'Гладить', long: 'Погладить', onClick: () => pat({ x: 50, y: 28 }), off: false },
  ];

  return (
    <div className="home">
      <StatBars pet={pet} className="home-stats" />

      <div className="home-room">
        <Room night={pet.isSleeping} wasteCount={pet.wasteCount} onCleanWaste={cleanOne} say={say}>
          <div
            className="pet-wrap"
            role="button"
            tabIndex={0}
            aria-label="Погладить Майнула"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY };
              pat(pointOf(e));
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 55) {
                drag.current = { x: e.clientX, y: e.clientY };
                pat(pointOf(e));
              }
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pat({ x: 50, y: 30 });
              }
            }}
          >
            <Pet mood={pet.mood} action={action} dirty={pet.isDirty} />
            {foodItem && (
              <div className="eat-food" aria-hidden="true">
                <ItemIcon code={foodItem.code} size={64} />
              </div>
            )}
            {hearts.map((h) => (
              <span key={h.id} className="float-heart" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                <PixelHeart size={26} />
              </span>
            ))}
          </div>
        </Room>
      </div>

      <div className="actions home-actions" role="group" aria-label="Действия">
        {actions.map((a) => (
          <button
            key={a.id}
            className={`action action--${a.id}`}
            onClick={a.onClick}
            aria-disabled={a.off || (busy && a.id !== 'pat') || undefined}
            aria-label={a.badge ? `${a.long}: ${a.badge}` : a.long}
          >
            <Icon name={a.icon} size={38} />
            <span className="label-short">{a.short}</span>
            <span className="label-long">{a.long}</span>
            {a.badge > 0 && <b className="action-badge">{a.badge}</b>}
          </button>
        ))}
      </div>

      <FeedSheet open={feedOpen} onClose={() => setFeedOpen(false)} onPick={feedWith} />
    </div>
  );
}
