import { useCallback, useEffect, useRef, useState } from 'react';
import { portfolioService, type Portfolio } from '../services/portfolio-service';

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.list();
      if (mountedRef.current) setPortfolios(data);
    } catch {
      if (mountedRef.current) setError('Failed to load portfolios');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const create = useCallback(async (payload: Parameters<typeof portfolioService.create>[0]) => {
    const p = await portfolioService.create(payload);
    setPortfolios(prev => [p, ...prev]);
    return p;
  }, []);

  const remove = useCallback(async (id: number) => {
    await portfolioService.remove(id);
    setPortfolios(prev => prev.filter(p => p.id !== id));
  }, []);

  return { portfolios, loading, error, refresh: load, create, remove };
}

export function usePortfolio(id: number) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portfolioService.get(id)
      .then(p => { if (!cancelled) setPortfolio(p); })
      .catch(() => { if (!cancelled) setError('Failed to load portfolio'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { portfolio, loading, error };
}
