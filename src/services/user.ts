import type { User as AuthUser } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Category, User } from '@/schemas/models';

import { ApiError, db, respond } from './mockServer';

/**
 * Profile data lives on the Supabase user (`user_metadata`) for now: name,
 * currency, notification choices. F1 moves it into a `profiles` table.
 * Accounts and transactions are still mock until F3, so we also copy the
 * profile into the mock "server" to keep those features consistent.
 */

async function currentAuthUser(): Promise<AuthUser> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError('Your session ended. Please log in again.', 401);
  return data.user;
}

async function toProfile(user: AuthUser): Promise<User> {
  const meta = user.user_metadata ?? {};
  const factors = await supabase.auth.mfa.listFactors();
  const profile: User = {
    id: user.id,
    firstName: meta.first_name ?? '',
    lastName: meta.last_name ?? '',
    email: user.email ?? '',
    currency: meta.currency ?? 'USD',
    mfaEnabled: (factors.data?.totp.length ?? 0) > 0,
    notifications: {
      push: meta.notify_push ?? true,
      weeklyRecap: meta.notify_weekly_recap ?? true,
    },
  };
  db.user = profile;
  return profile;
}

export async function getMe(): Promise<User> {
  return toProfile(await currentAuthUser());
}

/** Email changes need a confirmation flow, which arrives later; everything else saves here. */
export async function updateMe(patch: Partial<Omit<User, 'id' | 'email' | 'mfaEnabled'>>): Promise<User> {
  const data: Record<string, unknown> = {};
  if (patch.firstName !== undefined) data.first_name = patch.firstName;
  if (patch.lastName !== undefined) data.last_name = patch.lastName;
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.notifications) {
    data.notify_push = patch.notifications.push;
    data.notify_weekly_recap = patch.notifications.weeklyRecap;
  }
  const { data: result, error } = await supabase.auth.updateUser({ data });
  if (error || !result.user) throw new ApiError("We couldn't save that. Please try again.", error?.status ?? 500);
  return toProfile(result.user);
}

export function listCategories() {
  return respond<Category[]>(() => db.categories);
}

/**
 * Saves the onboarding currency on the profile. The starting balance still
 * goes to the mock default account until F3 creates real accounts.
 */
export async function completeOnboarding(input: { currency: string; startingBalance: number }): Promise<User> {
  const profile = await updateMe({ currency: input.currency });
  const account = db.accounts.find((a) => a.isDefault) ?? db.accounts[0];
  if (account) {
    const net = db.transactions
      .filter((t) => t.accountId === account.id)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    account.openingBalance = input.startingBalance - net;
  }
  return profile;
}
