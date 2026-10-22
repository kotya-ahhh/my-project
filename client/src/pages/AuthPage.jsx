import { useId, useState } from 'react';
import { Navigate } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const NAME_RE = /^[\p{L}\p{N}_.-]+$/u;

/** Те же правила, что и на сервере — чтобы подсказать сразу, без запроса. */
function validate(mode, { username, password, confirm }) {
  const name = username.trim();
  if (mode === 'register') {
    if (name.length < 3 || name.length > 20) return { field: 'username', message: 'Имя должно быть от 3 до 20 символов' };
    if (!NAME_RE.test(name)) return { field: 'username', message: 'В имени можно использовать буквы, цифры, «_», «-» и «.»' };
    if (password.length < 6) return { field: 'password', message: 'Пароль должен быть не короче 6 символов' };
    if (password !== confirm) return { field: 'confirm', message: 'Пароли не совпадают' };
  } else if (!name || !password) {
    return { field: name ? 'password' : 'username', message: 'Введите имя пользователя и пароль' };
  }
  return null;
}

export default function AuthPage() {
  const { user, signIn } = useAuth();
  const uid = useId();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null); // { field?, message }
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const register = mode === 'register';

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate(mode, form);
    if (problem) return setError(problem);
    setError(null);
    setPending(true);
    try {
      const data = register
        ? await api.register(form.username.trim(), form.password, form.confirm)
        : await api.login(form.username.trim(), form.password);
      signIn(data);
    } catch (err) {
      setError({ field: err.code === 'USERNAME_TAKEN' ? 'username' : undefined, message: err.message });
    } finally {
      setPending(false);
    }
  };

  const bad = (field) => error?.field === field || undefined;

  return (
    <main className="auth">
      <div className="auth-logo">
        <img src="/logo.png" alt="Майнул — манул, вылупляющийся из яйца" width="720" height="720" />
      </div>

      <div className="auth-card card card--shadow">
        <div className="segmented" role="tablist" aria-label="Вход или регистрация">
          {[['login', 'Вход'], ['register', 'Регистрация']].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={mode === id}
              onClick={() => { setMode(id); setError(null); }}
            >
              {label}
            </button>
          ))}
        </div>

        <h1>{register ? 'Заведите питомца' : 'С возвращением!'}</h1>
        <p className="muted">
          {register
            ? 'Создайте аккаунт, и Майнул вылупится специально для вас.'
            : 'Майнул скучал. Войдите, чтобы проведать его.'}
        </p>

        <form onSubmit={submit} noValidate className="auth-form">
          <div className="field">
            <label htmlFor={`${uid}-u`}>Имя пользователя</label>
            <input
              id={`${uid}-u`} className="input" value={form.username} onChange={set('username')}
              autoComplete="username" autoCapitalize="none" spellCheck="false" maxLength={20}
              aria-invalid={bad('username')}
            />
            {register && <span className="hint">3–20 символов: буквы, цифры, «_», «-», «.»</span>}
          </div>

          <div className="field">
            <label htmlFor={`${uid}-p`}>Пароль</label>
            <input
              id={`${uid}-p`} className="input" value={form.password} onChange={set('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete={register ? 'new-password' : 'current-password'} maxLength={72}
              aria-invalid={bad('password')}
            />
            {register && <span className="hint">Не короче 6 символов</span>}
          </div>

          {register && (
            <div className="field">
              <label htmlFor={`${uid}-c`}>Повторите пароль</label>
              <input
                id={`${uid}-c`} className="input" value={form.confirm} onChange={set('confirm')}
                type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={72}
                aria-invalid={bad('confirm')}
              />
            </div>
          )}

          <label className="check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <span>Показать пароль</span>
          </label>

          <div aria-live="assertive">
            {error && <p className="form-error" role="alert">{error.message}</p>}
          </div>

          <button className="btn btn--wide" type="submit" disabled={pending}>
            {pending ? <span className="spinner" aria-hidden="true" /> : null}
            {register ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>
      </div>
    </main>
  );
}
