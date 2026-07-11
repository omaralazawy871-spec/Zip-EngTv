import { useState, useEffect, useCallback } from 'react';

export function useLastWatched() {
  const [lastWatched, setLastWatched] = useState<number | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('engtv_last_watched');
    if (id) setLastWatched(Number(id));
  }, []);

  const setWatched = useCallback((id: number) => {
    localStorage.setItem('engtv_last_watched', id.toString());
    setLastWatched(id);
  }, []);

  return { lastWatched, setWatched };
}
