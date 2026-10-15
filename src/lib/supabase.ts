import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';
import { secureStorage } from './secureStorage';

// The anon key is public by design; row-level security protects user data.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Matches supabase-js's default session storage key. */
export const authStorageKey = `sb-${new URL(url || 'http://localhost').hostname.split('.')[0]}-auth-token`;

export const supabase = createClient<Database>(url || 'http://localhost:54321', anonKey || 'missing-anon-key', {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Auth uses 6-digit codes, not links.
    detectSessionInUrl: false,
    // MFA backup codes (experimental in supabase-js).
    experimental: { recoveryCodes: true },
  },
});

// Refresh tokens only while foregrounded (renews an expired session before the first request).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
