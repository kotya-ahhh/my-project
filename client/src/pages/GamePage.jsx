import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api.js';
import { usePet } from '../context/PetContext.jsx';
import { PetHead } from '../components/Pet.jsx';
import { Icon, ItemIcon, PixelHeart } from '../components/Icons.jsx';
import { ASPECT, CATCHER_W, ITEM_W, GameEngine } from '../game/engine.js';
import { plural } from '../utils.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Игровое поле: цикл кадров крутится вне React, а в state попадает только редкое (набор предметов, счёт). */
function Field({ session, onFinish }) {
  const fieldRef = useRef(null);
  const catcherRef = useRef(null);
  const els = useRef(new Map());
  const target = useRef(0.5);
  const size = useRef({ w: 300, h: 400 });
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [items, setItems] = useState([]);
  const [hud, setHud] = useState({ score: 0, lives: session.lives, secs: session.durationSec });
  const [face, setFace] = useState('happy');
  const [hitKey, setHitKey] = useState(0);
  const [pops, setPops] = useState([]);

  useEffect(() => {
    const engine = new GameEngine(session);
    const field = fieldRef.current;
    const keys = new Set();
    const timers = new Set();
    const after = (fn, ms) => {
      const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
      timers.add(t);
    };
    const minX = CATCHER_W / 2;
    const maxX = 1 - CATCHER_W / 2;
    let faceTimer;
    let popId = 0;
    let raf;
    let last = performance.now();
    let shown = { score: 0, lives: session.lives, secs: session.durationSec };

    const measure = () => {
      const r = field.getBoundingClientRect();
      size.current = { w: r.width, h: r.height };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(field);

    const onKey = (e, down) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const map = { ArrowLeft: 'l', a: 'l', ф: 'l', ArrowRight: 'r', d: 'r', в: 'r' };
      if (!map[k]) return;
      e.preventDefault();
      if (down) keys.add(map[k]);
      else keys.delete(map[k]);
    };
    const kd = (e) => onKey(e, true);
    const ku = (e) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const dir = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0);
      if (dir) target.current = clamp(target.current + dir * 1.15 * dt, minX, maxX);
      engine.playerX += (target.current - engine.playerX) * Math.min(1, dt * 16);

      const { events, changed } = engine.update(dt);

      const { w, h } = size.current;
      if (catcherRef.current) catcherRef.current.style.transform = `translateX(${(engine.playerX - CATCHER_W / 2) * w}px)`;
      for (const it of engine.items) {
        const el = els.current.get(it.id);
        if (el) el.style.transform = `translate(${(it.x - ITEM_W / 2) * w}px, ${it.y * h - (ITEM_W * w) / 2}px) rotate(${it.rot}deg)`;
      }
      if (changed) setItems(engine.items.map(({ id, kind, code }) => ({ id, kind, code })));

      for (const ev of events) {
        const good = ev.type === 'caught';
        setFace(good ? 'eating' : 'sad');
        if (!good) setHitKey((k) => k + 1);
        clearTimeout(faceTimer);
        faceTimer = setTimeout(() => setFace('happy'), good ? 280 : 650);
        const id = ++popId;
        setPops((p) => [...p.slice(-5), { id, x: ev.item.x * 100, good }]);
        after(() => setPops((p) => p.filter((q) => q.id !== id)), 750);
      }

      const next = { score: engine.score, lives: engine.lives, secs: Math.ceil(engine.time) };
      if (next.score !== shown.score || next.lives !== shown.lives || next.secs !== shown.secs) {
        shown = next;
        setHud(next);
      }

      if (engine.finished) {
        after(() => onFinishRef.current(engine.caught), 500);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(faceTimer);
      timers.forEach(clearTimeout);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [session]);

  const steer = (e) => {
    const r = fieldRef.current.getBoundingClientRect();
    target.current = clamp((e.clientX - r.left) / r.width, CATCHER_W / 2, 1 - CATCHER_W / 2);
  };

  return (
    <div className="game-play">
      <div className="game-hud">
        <div className="hud-score" aria-live="off">
          <b>{hud.score}</b>
          <span>очков</span>
        </div>
        <div className="hud-time" role="timer" aria-label={`Осталось ${hud.secs} ${plural(hud.secs, 'секунда', 'секунды', 'секунд')}`}>
          <div className="bar"><i style={{ width: `${(hud.secs / session.durationSec) * 100}%`, '--c': 'var(--sky)' }} /></div>
          <span>{hud.secs} с</span>
        </div>
        <div className="hud-lives" role="img" aria-label={`Жизней: ${hud.lives}`}>
          {Array.from({ length: session.lives }, (_, i) => <PixelHeart key={i} size={30} empty={i >= hud.lives} />)}
        </div>
      </div>

      <div
        ref={fieldRef}
        className="game-field"
        style={{ '--aspect': ASPECT }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); steer(e); }}
        onPointerMove={steer}
      >
        <div className="game-floor" />
        {items.map((it) => (
          <div
            key={it.id}
            className={`fall fall--${it.kind}`}
            style={{ transform: 'translate(-9999px, -9999px)' }}
            ref={(el) => { if (el) els.current.set(it.id, el); else els.current.delete(it.id); }}
          >
            <ItemIcon code={it.code} size="100%" />
          </div>
        ))}
        <div className="catcher" ref={catcherRef}>
          <div className={`catcher-inner ${hitKey ? 'shake' : ''}`} key={hitKey}>
            <PetHead face={face} />
          </div>
        </div>
        {pops.map((p) => (
          <span key={p.id} className={`pop ${p.good ? 'pop--good' : 'pop--bad'}`} style={{ left: `${p.x}%` }}>
            {p.good ? '+10' : '−1'}
          </span>
        ))}
      </div>
      <p className="muted game-help">Двигайте Майнула пальцем, мышью или стрелками ← →</p>
    </div>
  );
}

export default function GamePage() {
  const { pet, applyState } = usePet();
  const [phase, setPhase] = useState('intro'); // intro | playing | saving | done
  const [stats, setStats] = useState(null);
  const [session, setSession] = useState(null);
  const [caught, setCaught] = useState(0);
  const [result, setResult] = useState(null);
  const [startError, setStartError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [starting, setStarting] = useState(false);
  const prevBest = useRef(0);

  useEffect(() => {
    api.gameStats().then(setStats).catch(() => {});
  }, []);

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const s = await api.gameStart();
      prevBest.current = stats?.best ?? 0;
      setSession(s);
      setResult(null);
      setSaveError(null);
      setPhase('playing');
    } catch (e) {
      setStartError(e);
    } finally {
      setStarting(false);
    }
  };

  const save = async (count = caught) => {
    setPhase('saving');
    setSaveError(null);
    try {
      const res = await api.gameResult(session.sessionId, count);
      applyState(res);
      setResult(res.result);
      setStats((s) => ({ ...(s ?? {}), best: res.result.best, played: (s?.played ?? 0) + 1 }));
      setPhase('done');
    } catch (e) {
      setSaveError(e);
      setPhase('saving');
    }
  };

  const finish = (count) => {
    setCaught(count);
    save(count);
  };

  if (phase === 'playing') return <Field session={session} onFinish={finish} />;

  if (phase === 'saving') {
    return (
      <div className="state-box card" role="status">
        {saveError ? (
          <>
            <PetHead face="sad" />
            <h2>Награду не удалось получить</h2>
            <p className="muted">{saveError.message}</p>
            {saveError.status === 0 || saveError.status >= 500 ? (
              <button className="btn" onClick={() => save()}>Отправить ещё раз</button>
            ) : (
              <button className="btn" onClick={() => setPhase('intro')}>Понятно</button>
            )}
          </>
        ) : (
          <>
            <div className="spinner" />
            <p className="muted">Считаем монеты…</p>
          </>
        )}
      </div>
    );
  }

  if (phase === 'done' && result) {
    const record = result.score > 0 && result.score > prevBest.current;
    return (
      <div className="game-card card card--shadow result">
        <PetHead face={result.coinsEarned > 0 ? 'happy' : 'sad'} className="intro-head" />
        <h1>{record ? 'Новый рекорд!' : 'Партия окончена'}</h1>
        <dl className="result-grid">
          <div><dt>Очки</dt><dd>{result.score}</dd></div>
          <div>
            <dt>Награда</dt>
            <dd><Icon name="coin" size={30} /> +{result.coinsEarned}</dd>
          </div>
          <div><dt>Рекорд</dt><dd>{result.best}</dd></div>
        </dl>
        <p className="muted">Игра утомила Майнула, зато он повеселел.</p>
        <div className="row">
          <button className="btn" onClick={start} disabled={starting}>Сыграть ещё</button>
          <Link className="btn btn--cream" to="/">Домой</Link>
        </div>
        {startError && <p className="form-error" role="alert">{startError.message}</p>}
      </div>
    );
  }

  return (
    <div className="game-card card card--shadow">
      <PetHead face="happy" className="intro-head" />
      <h1>Лови еду!</h1>
      <ul className="rules">
        <li><ItemIcon code="pizza" size={40} /><span>Ловите еду ртом Майнула — за каждую монеты{stats?.maxCoins ? ` (до ${stats.maxCoins} за партию)` : ''}.</span></li>
        <li><ItemIcon code="rock" size={40} /><span>Камни и ботинки не ловите: каждый отнимает сердечко.</span></li>
        <li><PixelHeart size={34} /><span>Три сердечка и 45 секунд. Игра утомляет Майнула, но радует.</span></li>
      </ul>
      {stats && (
        <p className="intro-stats">
          Рекорд: <b>{stats.best}</b> · Сыграно: <b>{stats.played}</b> {plural(stats.played, 'раз', 'раза', 'раз')}
        </p>
      )}
      {pet?.isSleeping && <p className="form-error">Майнул спит. Разбудите его на главной, тогда можно играть.</p>}
      {startError && <p className="form-error" role="alert">{startError.message}</p>}
      <button className="btn btn--wide" onClick={start} disabled={starting || pet?.isSleeping}>
        {starting ? <span className="spinner" aria-hidden="true" /> : <Icon name="gamepad" size={28} />}
        Играть
      </button>
    </div>
  );
}
