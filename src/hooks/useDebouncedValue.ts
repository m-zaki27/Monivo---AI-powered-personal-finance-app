import { useEffect, useState } from 'react';

/** Returns `value` only after it has stopped changing for `ms` (e.g. search-as-you-type). */
export function useDebouncedValue<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
