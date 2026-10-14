import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/http.ts';

/**
 * Deletes the calling user. Needs the service-role key (admin rights), which
 * is why this runs here and never in the app. Supabase injects SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY into every Edge Function automatically.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Not signed in' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify the caller's JWT ourselves (gateway verification is off for this function).
  const { data, error } = await admin.auth.getClaims(token);
  if (error || !data) return json({ error: 'Your session ended. Log in again.' }, 401);
  const userId = data.claims.sub;

  // With two-step on, a password-only session isn't enough to destroy the account.
  const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId });
  const hasMfa = factors?.factors.some((f) => f.factor_type === 'totp' && f.status === 'verified');
  if (hasMfa && data.claims.aal !== 'aal2') return json({ error: 'Verify two-step first.' }, 403);

  // Tables added in F1 reference auth.users with ON DELETE CASCADE, so their rows go too.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: "Couldn't delete the account." }, 500);

  return json({ ok: true });
});
