import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryCache, QueryClient, type Query } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, Platform } from 'react-native';

import { secureStorage } from '@/lib/secureStorage';
import { supabase } from '@/lib/supabase';
import { ApiError } from '@/services/errors';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// On 401/403 with no Supabase session, sign out locally so the route guards send the user to log in.
async function signOutIfSessionLost(error: unknown) {
  if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) await supabase.auth.signOut({ scope: 'local' });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (e) => void signOutIfSessionLost(e) }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Must outlive the persisted cache's maxAge, or restored data is dropped.
      gcTime: WEEK_MS,
      retry: 1,
    },
    mutations: {
      // Fail fast offline instead of pausing, so save buttons don't spin forever.
      networkMode: 'always',
    },
  },
});

const isOnline = (s: Network.NetworkState) => s.isConnected !== false && s.isInternetReachable !== false;

onlineManager.setEventListener((setOnline) => {
  Network.getNetworkStateAsync()
    .then((s) => setOnline(isOnline(s)))
    .catch(() => {});
  const sub = Network.addNetworkStateListener((s) => setOnline(isOnline(s)));
  return () => sub.remove();
});

// Treat returning to the app as window focus so stale queries refetch.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (state) => setFocused(state === 'active'));
    return () => sub.remove();
  });
}

// Cache is persisted encrypted so the app opens with last-known data offline.
export const queryPersister = createAsyncStoragePersister({ storage: secureStorage, key: 'monivo.query-cache' });

export const persistOptions = {
  persister: queryPersister,
  maxAge: WEEK_MS,
  // Bump when cached data changes shape.
  buster: 'v1',
  dehydrateOptions: {
    // Never persist auth queries (backup codes).
    shouldDehydrateQuery: (q: Query) => q.state.status === 'success' && q.queryKey[0] !== 'auth',
  },
};
