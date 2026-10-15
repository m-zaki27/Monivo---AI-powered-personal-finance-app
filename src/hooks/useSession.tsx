import { isAuthRetryableFetchError, type Session, type User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { secureStorage } from '@/lib/secureStorage';
import { authStorageKey, supabase } from '@/lib/supabase';
import { authApi } from '@/services';

import { queryPersister } from './queryClient';

// Offline with an expired token, getSession() reports no session; fall back to the
// stored one so the app opens with cached data and Supabase refreshes once online.
async function loadSavedSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (data.session || !error || !isAuthRetryableFetchError(error)) return data.session;
  const saved = await secureStorage.getItem(authStorageKey).catch(() => null);
  if (!saved) return null;
  const session = JSON.parse(saved) as Session;
  // Don't bypass an unfinished MFA challenge offline.
  const hasTwoStep = session.user.factors?.some((f) => f.status === 'verified');
  return hasTwoStep && tokenAal(session.access_token) !== 'aal2' ? null : session;
}

/** Reads the JWT `aal` claim (aal2 = MFA completed). */
function tokenAal(jwt: string): string | undefined {
  try {
    // base64url → padded base64 for atob
    const b64 = jwt.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='))).aal;
  } catch {
    return undefined;
  }
}

/** `recovering`: signed in via password-reset code, must set a new password first. */
export type SessionStatus = 'signedOut' | 'mfaRequired' | 'recovering' | 'signedIn';

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  /** Stored in Supabase user metadata. */
  onboarded: boolean;
  isHydrated: boolean;
  /** Re-checks whether MFA is still needed (call after verifying a code). */
  refresh: () => Promise<void>;
  setRecovering: (value: boolean) => void;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Derives a single auth `status` for the route guards from Supabase's session. */
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
    loadSavedSession()
      .then(evaluate)
      .finally(() => setIsHydrated(true));

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Handled by loadSavedSession; this event would undo the offline fallback.
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') {
        qc.clear();
        void queryPersister.removeClient();
      }
      // Awaiting Supabase calls inside this callback can deadlock; defer to the next tick.
      setTimeout(() => void evaluate(next), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate, qc]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await evaluate(data.session);
  }, [evaluate]);

  const completeOnboarding = useCallback(async () => {
    // The resulting USER_UPDATED event refreshes the session and the guard redirects.
    await supabase.auth.updateUser({ data: { onboarded: true } });
  }, []);

  const signOut = useCallback(async () => {
    setRecovering(false);
    await authApi.logOut().catch(() => {});
    qc.clear();
    await queryPersister.removeClient();
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
