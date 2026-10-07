import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { sessionSchema, type Session } from '@/schemas/auth';
import { authApi } from '@/services';

const STORAGE_KEY = 'monivo.session';

interface SessionContextValue {
  session: Session | null;
  /** False until the saved session has been read from storage. */
  isHydrated: boolean;
  signIn: (session: Session) => void;
  completeOnboarding: () => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Who is signed in, and whether they've finished onboarding. This is client
 * state (not server data), so it lives in React context rather than TanStack
 * Query. The root layout's route guards read it: change the session and the
 * router moves the user to the right group by itself.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = sessionSchema.safeParse(raw ? JSON.parse(raw) : null);
        if (parsed.success) setSession(parsed.data);
      })
      .catch(() => {})
      .finally(() => setIsHydrated(true));
  }, []);

  // Persist after every change (but never before we've loaded, or we'd wipe it).
  useEffect(() => {
    if (!isHydrated) return;
    const write = session ? AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)) : AsyncStorage.removeItem(STORAGE_KEY);
    write.catch(() => {});
  }, [session, isHydrated]);

  const signIn = useCallback((s: Session) => setSession(s), []);
  const completeOnboarding = useCallback(() => setSession((s) => (s ? { ...s, onboarded: true } : s)), []);
  const signOut = useCallback(() => {
    authApi.logOut().catch(() => {});
    setSession(null);
    // Drop every cached query so the next user never sees this one's data.
    qc.clear();
  }, [qc]);

  const value = useMemo(
    () => ({ session, isHydrated, signIn, completeOnboarding, signOut }),
    [session, isHydrated, signIn, completeOnboarding, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
