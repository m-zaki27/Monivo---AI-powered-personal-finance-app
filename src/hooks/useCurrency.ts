import { DEFAULT_CURRENCY } from '@/lib/money';

import { useMe } from './useUser';

/** User's display currency; falls back to the default while loading. */
export function useCurrency(): string {
  return useMe().data?.currency ?? DEFAULT_CURRENCY;
}
