import { useState, useEffect, useCallback } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('engtv_favorites') || '[]');
    setFavorites(favs);
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('engtv_favorites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { favorites, toggleFavorite };
}
