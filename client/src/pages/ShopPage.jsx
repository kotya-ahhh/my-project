import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon, ItemIcon } from '../components/Icons.jsx';
import { PetHead } from '../components/Pet.jsx';
import { plural } from '../utils.js';

const TABS = [
  { id: 'food', label: 'Еда' },
  { id: 'medicine', label: 'Лекарства' },
];
const EFFECT = { hunger: 'Сытость', sleep: 'Сон' };

export default function ShopPage() {
  const { coins, applyState, refresh } = usePet();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('food');
  const [selectedId, setSelectedId] = useState(null);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  const load = () => {
    setError(null);
    api.shop().then((r) => setItems(r.items)).catch(setError);
  };
  useEffect(load, []);

  if (error && !items) {
    return (
      <div className="state-box">
        <PetHead face="sad" />
        <h2>Магазин не открылся</h2>
        <p className="muted">{error.message}</p>
        <button className="btn" onClick={load}>Повторить</button>
      </div>
    );
  }
  if (!items) {
    return (
      <div className="state-box" role="status">
        <div className="spinner" />
        <p className="muted">Раскладываем товары…</p>
      </div>
    );
  }

  const visible = items.filter((i) => i.category === tab);
  const selected = visible.find((i) => i.id === selectedId) ?? visible[0];
  const total = selected ? selected.price * qty : 0;
  const missing = Math.max(0, total - (coins ?? 0));

  const pick = (id) => { setSelectedId(id); setQty(1); };
  const changeQty = (n) => setQty(Math.min(99, Math.max(1, n || 1)));

  const buy = async () => {
    if (!selected || buying || missing > 0) return;
    setBuying(true);
    try {
      const res = await api.buy(selected.id, qty);
      applyState({ coins: res.coins });
      toast(`${selected.name} ×${qty} — в инвентаре`, 'success');
      setQty(1);
    } catch (e) {
      toast(e.message, 'error');
      if (e.status === 409) refresh(); // баланс мог устареть
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="shop">
      <div className="page-head">
        <h1>Магазин</h1>
        <p className="muted">Обменяйте монеты на еду и лекарства. Монеты можно заработать в мини-игре.</p>
      </div>

      <div className="segmented shop-tabs" role="tablist" aria-label="Категория товаров">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setSelectedId(null); setQty(1); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="shop-body">
        <ul className="shop-list" aria-label="Товары">
          {visible.map((it) => (
            <li key={it.id}>
              <button className="shop-card" aria-pressed={selected?.id === it.id} onClick={() => pick(it.id)}>
                <ItemIcon code={it.code} size={56} />
                <b>{it.name}</b>
                <span className="price"><Icon name="coin" size={20} />{it.price}</span>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <section className="card shop-detail" aria-live="polite" aria-label={`Товар: ${selected.name}`}>
            <div className="detail-head">
              <ItemIcon code={selected.code} size={88} />
              <div>
                <h2>{selected.name}</h2>
                <p className="effect">
                  {EFFECT[selected.effectType]} <b>+{selected.effectValue}%</b>
                </p>
              </div>
            </div>
            <p>{selected.description}</p>

            <div className="buy-row">
              <div className="stepper" role="group" aria-label="Количество">
                <button className="btn btn--cream btn--icon btn--small" onClick={() => changeQty(qty - 1)} aria-label="Меньше" disabled={qty <= 1}>
                  <Icon name="minus" size={20} />
                </button>
                <input
                  className="input stepper-input" inputMode="numeric" aria-label="Количество штук"
                  value={qty} onChange={(e) => changeQty(parseInt(e.target.value.replace(/\D/g, ''), 10))}
                />
                <button className="btn btn--cream btn--icon btn--small" onClick={() => changeQty(qty + 1)} aria-label="Больше" disabled={qty >= 99}>
                  <Icon name="plus" size={20} />
                </button>
              </div>
              <div className="total"><Icon name="coin" size={26} /> {total}</div>
            </div>

            <button className="btn btn--wide" onClick={buy} disabled={buying || missing > 0}>
              {buying ? <span className="spinner" aria-hidden="true" /> : <Icon name="shop" size={26} />}
              Купить
            </button>
            {missing > 0 && (
              <p className="form-error" role="status">
                Не хватает {missing} {plural(missing, 'монеты', 'монет', 'монет')}. Загляните в мини-игру!
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
