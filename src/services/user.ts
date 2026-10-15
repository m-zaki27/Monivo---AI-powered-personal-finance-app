import type { TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import type { Category, CategoryIcon, TransactionType, User } from '@/schemas/models';
import type { CategoryColor } from '@/theme/tokens';

import { ApiError, unwrap } from './errors';

async function currentUserId(): Promise<{ id: string; email: string }> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError('Your session ended. Please log in again.', 401);
  return { id: data.user.id, email: data.user.email ?? '' };
}

export async function getMe(): Promise<User> {
  const { id, email } = await currentUserId();
  const [profile, factors] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single().then(unwrap),
    supabase.auth.mfa.listFactors(),
  ]);
  // Server-sent emails are scheduled in the user's time zone; keep it in sync.
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (deviceTz && deviceTz !== profile.timezone) {
    void supabase.from('profiles').update({ timezone: deviceTz }).eq('id', id).then(() => undefined);
  }
  return {
    id,
    email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    currency: profile.currency,
    mfaEnabled: (factors.data?.totp.length ?? 0) > 0,
    avatarUrl: profile.avatar_url,
    notifications: { push: profile.notify_push, weeklyRecap: profile.notify_weekly_recap },
  };
}

export async function updateMe(patch: Partial<Omit<User, 'id' | 'email' | 'mfaEnabled' | 'avatarUrl'>>): Promise<User> {
  const { id } = await currentUserId();
  const update: TablesUpdate<'profiles'> = {};
  if (patch.firstName !== undefined) update.first_name = patch.firstName;
  if (patch.lastName !== undefined) update.last_name = patch.lastName;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.notifications) {
    update.notify_push = patch.notifications.push;
    update.notify_weekly_recap = patch.notifications.weeklyRecap;
  }
  unwrap(await supabase.from('profiles').update(update).eq('id', id).select('id').single());
  return getMe();
}

// Categories are shared and static: fetch once per app run.
let categoriesPromise: Promise<Category[]> | null = null;

export function listCategories(): Promise<Category[]> {
  categoriesPromise ??= (async () => {
    const rows = unwrap(await supabase.from('categories').select('id, name, icon, color, kind').order('sort_order'));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon as CategoryIcon,
      color: r.color as CategoryColor,
      kind: r.kind as TransactionType,
    }));
  })().catch((e) => {
    // Don't cache a failure.
    categoriesPromise = null;
    throw e;
  });
  return categoriesPromise;
}

/** Saves the currency and creates the first account if none exists. */
export async function completeOnboarding(input: { currency: string; startingBalance: number }): Promise<User> {
  const user = await updateMe({ currency: input.currency });
  const { count } = await supabase.from('accounts').select('id', { count: 'exact', head: true });
  if ((count ?? 0) === 0) {
    unwrap(
      await supabase
        .from('accounts')
        .insert({ name: 'Main account', type: 'bank', color: 'cobalt', opening_balance: input.startingBalance })
        .select('id')
        .single(),
    );
  }
  return user;
}
