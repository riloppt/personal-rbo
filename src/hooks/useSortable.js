import { useState, useMemo, useCallback } from 'react';

export function useSortable(data, getVal) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev !== key) { setSortDir('asc'); return key; }
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const gv = getVal || ((k, r) => r[k] ?? '');
    return [...data].sort((a, b) => {
      const va = gv(sortKey, a);
      const vb = gv(sortKey, b);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va ?? '').localeCompare(String(vb ?? ''), 'pt', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, getVal]);

  return { sorted, sortKey, sortDir, toggleSort };
}
