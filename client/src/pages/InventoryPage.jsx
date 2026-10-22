import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { usePet } from '../context/PetContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import StatBars from '../components/StatBars.jsx';
import { Icon, ItemIcon } from '../components/Icons.jsx';
import { PetHead } from '../components/Pet.jsx';

const EFFECT = { hunger: 'Сытость', sleep: 'Сон' };
const GROUPS = [
  { id: 'food', title: 'Еда' },
  { id: 'medicine', title: 'Лекарства' },
];

export default function InventoryPage() {
  const { pet, applyState, refresh } = usePet();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [usingId, setUsingId] = useState(null);

  const load = () => {
    setError(null);
    api.inventory().then((r) => setItems(r.items)).catch(setError);
  };
  useEffect(load, []);

  const use = async (item) => {
    if (usingId) return;
    setUsingId(item.id);
    try {
      const res = await api.use(item.id);
      applyState(res);
      setItems(res.inventory);
      toast(`${EFFECT[res.used.stat]} +${res.used.delta}%`, 'success');
    } catch (e) {
      toast(e.message, 'error');
      if (e.status === 409 || e.status === 404) { refresh(); load(); }
    } finally {
      setUsingId(null);
    }
  };

  if (error && !items) {
    return (
      <div className="state-box">
        <PetHead face="sad" />
        <h2>Не удалось открыть рюкзак</h2>
        <p className="muted">{error.message}</p>
        <button className="btn" onClick={load}>Повторить</button>
      </div>
    );
  }
  if (!items) {
    return (
      <div className="state-box" role="status">
        <div className="spinner" />
        <p className="muted">Заглядываем в рюкзак…</p>
      </div>
    );
  }

  return (
    <div className="inventory">
      <div className="page-head">
        <h1>Инвентарь</h1>
        <p className="muted">
          {pet?.isSleeping ? 'Майнул спит — пока он не проснётся, предметы использовать нельзя.' : 'Выберите предмет, и Майнул сразу его получит.'}
        </p>
      </div>

      <StatBars pet={pet} className="inv-stats" />

      {items.length === 0 ? (
        <div className="state-box card">
          <PetHead face="hungry" />
          <h2>Здесь пока пусто</h2>
          <p className="muted">Купите еду или лекарства в магазине — монеты можно заработать в мини-игре.</p>
          <Link className="btn" to="/shop"><Icon name="shop" size={26} /> В магазин</Link>
        </div>
      ) : (
        GROUPS.map((g) => {
          const list = items.filter((i) => i.category === g.id);
          if (!list.length) return null;
          return (
            <section key={g.id} className="inv-group" aria-label={g.title}>
              <h2>{g.title}</h2>
              <ul className="inv-grid">
                {list.map((it) => (
                  <li key={it.id} className="card inv-card">
                    <div className="inv-icon">
                      <ItemIcon code={it.code} size={64} />
                      <b className="qty" aria-label={`${it.quantity} шт.`}>×{it.quantity}</b>
                    </div>
                    <h3>{it.name}</h3>
                    <p className="muted">{EFFECT[it.effectType]} +{it.effectValue}%</p>
                    <button className="btn btn--small btn--wide" onClick={() => use(it)} disabled={usingId === it.id} aria-disabled={pet?.isSleeping || undefined}>
                      Использовать
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
