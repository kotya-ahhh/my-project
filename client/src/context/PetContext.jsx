import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';

const PetContext = createContext(null);
export const usePet = () => useContext(PetContext);

/**
 * Хранит состояние питомца и баланс для всех страниц.
 * Сервер — единственный источник правды: клиент только показывает то, что вернул API.
 * Пока питомец спит, состояние опрашивается чаще, чтобы шкала сна росла на глазах.
 */
export function PetProvider({ children }) {
  const [pet, setPet] = useState(null);
  const [coins, setCoins] = useState(null);
  const [error, setError] = useState(null);
  const sleepingRef = useRef(false);

  const applyState = useCallback((data) => {
    if (data.pet) {
      setPet(data.pet);
      sleepingRef.current = data.pet.isSleeping;
    }
    if (typeof data.coins === 'number') setCoins(data.coins);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      applyState(await api.pet());
    } catch (e) {
      setError(e);
    }
  }, [applyState]);

  useEffect(() => {
    refresh();
    let timer;
    const tick = () => {
      if (!document.hidden) refresh();
      timer = setTimeout(tick, sleepingRef.current ? 5000 : 20000);
    };
    timer = setTimeout(tick, 5000);
    const onVisible = () => !document.hidden && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const value = useMemo(() => ({ pet, coins, error, refresh, applyState }), [pet, coins, error, refresh, applyState]);
  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}
