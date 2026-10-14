import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * The one Supabase client. Keys come from `.env.local` (EXPO_PUBLIC_ vars are
 * inlined into the app at build time). The anon key is *meant* to be public:
 * row-level security in the database is what protects each user's data.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing-anon-key', {
  auth: {
    // Supabase's recommended storage for React Native. Survives app restarts.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // There are no auth links to parse in a native app: we use 6-digit codes.
    detectSessionInUrl: false,
    // Native MFA backup codes (still flagged experimental in supabase-js).
    experimental: { recoveryCodes: true },
  },
});

/**
 * Only refresh tokens while the app is in the foreground. When it comes back,
 * refreshing straight away means an expired session is renewed before the
 * first request rather than failing it.
 */
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
