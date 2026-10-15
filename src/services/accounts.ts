import type { TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import type { Account, AccountType, AccountWithBalance } from '@/schemas/models';
import type { CategoryColor } from '@/theme/tokens';

import { ApiError, unwrap } from './errors';

type BalanceRow = {
  id: string | null;
  name: string | null;
  type: string | null;
  institution: string | null;
  last4: string | null;
  color: string | null;
  opening_balance: number | null;
  is_default: boolean | null;
  created_at: string | null;
  balance: number | null;
  transaction_count: number | null;
};

// View columns are typed nullable, but these never are.
function toAccount(r: BalanceRow): AccountWithBalance {
  return {
    id: r.id!,
    name: r.name!,
    type: r.type as AccountType,
    institution: r.institution ?? undefined,
    last4: r.last4 ?? undefined,
    color: (r.color ?? 'cobalt') as CategoryColor,
    openingBalance: Number(r.opening_balance ?? 0),
    isDefault: !!r.is_default,
    createdAt: r.created_at!,
    balance: Number(r.balance ?? 0),
    transactionCount: r.transaction_count ?? 0,
  };
}

export async function listAccounts(): Promise<AccountWithBalance[]> {
  const rows = unwrap(await supabase.from('account_balances').select('*').order('created_at'));
  return rows.map(toAccount);
}

async function getAccount(id: string): Promise<AccountWithBalance> {
  const row = unwrap(await supabase.from('account_balances').select('*').eq('id', id).maybeSingle());
  if (!row) throw new ApiError("We couldn't find that account. It may have been deleted.", 404);
  return toAccount(row);
}

export type NewAccount = Pick<Account, 'name' | 'type' | 'institution' | 'last4' | 'color'> & {
  startingBalance: number;
  isDefault?: boolean;
};

export async function createAccount(input: NewAccount): Promise<AccountWithBalance> {
  const row = unwrap(
    await supabase
      .from('accounts')
      .insert({
        name: input.name,
        type: input.type,
        institution: input.institution ?? null,
        last4: input.last4 ?? null,
        color: input.color,
        opening_balance: input.startingBalance,
      })
      .select('id')
      .single(),
  );
  // A DB trigger makes the first account default automatically.
  if (input.isDefault) await setDefaultAccount(row.id);
  return getAccount(row.id);
}

type AccountPatch = Partial<Pick<Account, 'name' | 'type' | 'institution' | 'last4' | 'color'>>;

export async function updateAccount(id: string, patch: AccountPatch): Promise<AccountWithBalance> {
  const update: TablesUpdate<'accounts'> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.type !== undefined) update.type = patch.type;
  if ('institution' in patch) update.institution = patch.institution ?? null;
  if ('last4' in patch) update.last4 = patch.last4 ?? null;
  if (patch.color !== undefined) update.color = patch.color;
  unwrap(await supabase.from('accounts').update(update).eq('id', id).select('id').single());
  return getAccount(id);
}

/** Single RPC so two accounts are never both default. */
export async function setDefaultAccount(id: string): Promise<AccountWithBalance[]> {
  unwrap(await supabase.rpc('set_default_account', { p_account_id: id }));
  return listAccounts();
}

/** Cascades to its transactions; the last account can't be deleted. */
export async function deleteAccount(id: string) {
  const { count } = await supabase.from('accounts').select('id', { count: 'exact', head: true });
  if ((count ?? 0) <= 1) {
    throw new ApiError('You need at least one account. Add another before deleting this one.', 409);
  }
  const rows = unwrap(await supabase.from('accounts').delete().eq('id', id).select('id'));
  // RLS reports a forbidden delete as 0 rows, not an error.
  if (rows.length === 0) throw new ApiError("We couldn't delete that account. Please try again.", 403);
  return { id };
}
