import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { authApi } from '@/services';

/**
 * - signedOut: no session
 * - mfaRequired: password accepted, authenticator code still needed
 * - recovering: signed in by a password-reset code, must set a new password first
 * - signedIn: fully in
 */
export type SessionStatus = 'signedOut' | 'mfaRequired' | 'recovering' | 'signedIn';

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  /** Finished onboarding (stored on the Supabase user until F1 adds a profiles table). */
  onboarded: boolean;
  /** False until the saved session has been read from storage. */
  isHydrated: boolean;
  /** Re-checks whether a second factor is still needed (after a code is verified). */
  refresh: () => Promise<void>;
  setRecovering: (value: boolean) => void;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Supabase owns the session (it saves, restores and refreshes tokens). This
 * provider just listens and derives one `status` the route guards read: when
 * Supabase signs someone in or out, the guards move them to the right screens.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [mfaPending, setMfaPending] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const evaluate = useCallback(async (next: Session | null) => {
    setSession(next);
    setMfaPending(next ? await authApi.needsMfa().catch(() => false) : false);
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => evaluate(data.session))
      .finally(() => setIsHydrated(true));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      // Supabase warns against awaiting its own methods inside this callback
      // (it can deadlock), so the follow-up check runs on the next tick.
      setTimeout(() => void evaluate(next), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await evaluate(data.session);
  }, [evaluate]);

  const completeOnboarding = useCallback(async () => {
    // USER_UPDATED fires afterwards, the session updates, and the guard swaps in the tabs.
    await supabase.auth.updateUser({ data: { onboarded: true } });
  }, []);

  const signOut = useCallback(async () => {
    setRecovering(false);
    await authApi.logOut().catch(() => {});
    // Drop every cached query so the next user never sees this one's data.
    qc.clear();
  }, [qc]);

  const status: SessionStatus = !session ? 'signedOut' : recovering ? 'recovering' : mfaPending ? 'mfaRequired' : 'signedIn';
  const user = session?.user ?? null;
  const onboarded = user?.user_metadata?.onboarded === true;

  const value = useMemo(
    () => ({ status, user, onboarded, isHydrated, refresh, setRecovering, completeOnboarding, signOut }),
    [status, user, onboarded, isHydrated, refresh, completeOnboarding, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
