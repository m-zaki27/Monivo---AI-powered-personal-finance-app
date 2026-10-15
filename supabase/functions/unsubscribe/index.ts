import { createClient } from 'npm:@supabase/supabase-js@2';

import { verifyUnsubscribe } from '../_shared/unsubscribe.ts';

// One-tap unsubscribe, no login: the signed link proves the user and email type.
// GET = link in the email; POST = Gmail's one-click button (List-Unsubscribe-Post).
// Plain text because Supabase serves HTML from *.supabase.co as text anyway (anti-phishing).

function reply(message: string, status = 200) {
  return new Response(`Monivo\n\n${message}\n`, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') return reply('Method not allowed.', 405);

  const url = new URL(req.url);
  const userId = url.searchParams.get('u') ?? '';
  const kind = url.searchParams.get('k') ?? '';
  const sig = url.searchParams.get('s') ?? '';

  if (!userId || !(await verifyUnsubscribe(userId, kind, sig))) {
    return reply("This unsubscribe link isn't valid. You can turn emails off in Monivo → Settings.", 400);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } =
    kind === 'budget_alert'
      ? await admin.from('budgets').update({ email_alerts: false }).eq('user_id', userId)
      : await admin.from('profiles').update({ notify_weekly_recap: false }).eq('id', userId);
  if (error) return reply('Something went wrong. Please try again, or turn emails off in Monivo → Settings.', 500);

  return reply(
    kind === 'budget_alert'
      ? "You're unsubscribed from budget alerts. Turn them back on anytime in Monivo → Accounts → Budget."
      : "You're unsubscribed from the weekly recap. Turn it back on anytime in Monivo → Settings → Notifications.",
  );
});
