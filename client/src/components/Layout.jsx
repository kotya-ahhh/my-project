import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { PetProvider, usePet } from '../context/PetContext.jsx';
import { Icon } from './Icons.jsx';

const NAV = [
  { to: '/', label: 'Дом', icon: 'home', end: true },
  { to: '/game', label: 'Игра', icon: 'gamepad' },
  { to: '/shop', label: 'Магазин', icon: 'shop' },
  { to: '/inventory', label: 'Инвентарь', icon: 'backpack' },
];

export function CoinBalance() {
  const { coins } = usePet();
  const prev = useRef(coins);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (prev.current !== null && coins !== null && prev.current !== coins) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      prev.current = coins;
      return () => clearTimeout(t);
    }
    prev.current = coins;
  }, [coins]);

  return (
    <div className={`coins ${bump ? 'bump' : ''}`} aria-label={`Монет: ${coins ?? 'загрузка'}`}>
      <Icon name="coin" size={28} />
      <span aria-hidden="true">{coins ?? '—'}</span>
    </div>
  );
}

function Shell() {
  const { logout } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Майнул — на главную">
          <img src="/mainul-icon.png" alt="" width="44" height="44" />
          <span>Майнул</span>
        </Link>

        <nav className="tabbar" aria-label="Основная навигация">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="tab">
              <Icon name={n.icon} size={28} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="topbar-tools">
          <CoinBalance />
          <button className="btn btn--cream btn--icon btn--small" onClick={logout} aria-label="Выйти из аккаунта" title="Выйти">
            <Icon name="logout" size={24} />
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

/** Всё, что видно после входа: питомец и баланс живут на уровне каркаса. */
export default function Layout() {
  return (
    <PetProvider>
      <Shell />
    </PetProvider>
  );
}
