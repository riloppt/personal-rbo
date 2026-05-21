import { useReducer, useMemo, useCallback } from 'react';

function sortReducer(state, key) {
  if (state.sortKey === key) {
    return { sortKey: key, sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' };
  }
  return { sortKey: key, sortDir: 'asc' };
}

export function useSortable(data, getVal) {
  const [{ sortKey, sortDir }, dispatch] = useReducer(sortReducer, { sortKey: null, sortDir: 'asc' });

  const toggleSort = useCallback((key) => dispatch(key), []);

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
