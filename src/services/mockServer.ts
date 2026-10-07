import { mockAccounts } from '@/mock/accounts';
import { mockBudget } from '@/mock/budget';
import { mockCategories } from '@/mock/categories';
import { mockTransactions } from '@/mock/transactions';
import { mockUser } from '@/mock/users';

/** JSON round-trip: the data is plain JSON (as an API would send), and Hermes lacks structuredClone. */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/**
 * The fake "server". Services mutate this in-memory copy so changes survive
 * across screens for the session (until the app reloads).
 * When the real API arrives, this file and the bodies of src/services/* go away;
 * hooks and screens stay untouched.
 */
export const db = {
  user: clone(mockUser),
  accounts: clone(mockAccounts),
  transactions: clone(mockTransactions),
  categories: clone(mockCategories),
  budget: clone(mockBudget),
  /** Two-step verification state (never sent to the client as-is). */
  auth: { mfaSecret: null as string | null, backupCodes: [] as string[] },
};

/** Toggled from the /dev screen to exercise loading and error states. */
export const mockConfig = {
  latencyMs: 450,
  failRequests: false,
};

export class ApiError extends Error {
  /**
   * `field` names the form input the error belongs to (e.g. 'email'), so forms
   * can show it under that input instead of in a generic banner.
   */
  constructor(message: string, public status = 500, public field?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Simulates network latency (±30% jitter) and optional failure. */
export async function respond<T>(produce: () => T): Promise<T> {
  const jitter = mockConfig.latencyMs * (0.7 + Math.random() * 0.6);
  await new Promise((r) => setTimeout(r, jitter));
  if (mockConfig.failRequests) throw new ApiError("We couldn't reach Monivo. Check your connection and try again.");
  // Clone so callers can never mutate the "server" by accident.
  return clone(produce());
}

let idCounter = 10_000;
export const newId = (prefix: string) => `${prefix}_${(++idCounter).toString(36)}${Date.now().toString(36).slice(-4)}`;
