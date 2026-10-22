import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  // «checking» — пока проверяем сохранённый токен, чтобы не мигала страница входа
  const [checking, setChecking] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const signIn = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      toast('Сессия истекла. Войдите снова', 'error');
    });
  }, [logout, toast]);

  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    api
      .me()
      .then((r) => alive && setUser(r.user))
      .catch(() => {})
      .finally(() => alive && setChecking(false));
    return () => { alive = false; };
  }, []);

  const value = useMemo(() => ({ user, checking, signIn, logout }), [user, checking, signIn, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
