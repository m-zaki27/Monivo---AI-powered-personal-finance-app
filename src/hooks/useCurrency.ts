import { DEFAULT_CURRENCY } from '@/lib/money';

import { useMe } from './useUser';

/** The user's display currency (chosen in onboarding). Falls back to USD while loading. */
export function useCurrency(): string {
  return useMe().data?.currency ?? DEFAULT_CURRENCY;
}
