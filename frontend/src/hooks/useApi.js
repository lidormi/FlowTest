import { useState, useEffect, useCallback } from 'react';

const BASE = (import.meta.env.VITE_API_URL || 'https://flowtest-production.up.railway.app') + '/api';

async function apiFetch(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(path);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { load(); }, [load, ...deps]);

  return { data, loading, error, refetch: load };
}

export async function runTest(testId) {
  return apiFetch(`/tests/${testId}/run`, { method: 'POST' });
}

export async function resolveAlert(alertId) {
  return apiFetch(`/dashboard/alerts/${alertId}/resolve`, { method: 'PATCH' });
}

export async function getTestStatus(testId) {
  return apiFetch(`/tests/${testId}/status`);
}
