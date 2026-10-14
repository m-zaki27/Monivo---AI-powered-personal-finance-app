import { createClient } from 'npm:@supabase/supabase-js@2';

import { verifyUnsubscribe } from '../_shared/unsubscribe.ts';

/**
 * One-tap unsubscribe from an email link (GET, no login needed). The signed
 * link proves which user and email type it's for; then the matching setting
 * is switched off. Shows a small confirmation page.
 */

function page(title: string, message: string, status = 200) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0; background:#0B1020; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#F4F1EA; display:flex; min-height:100vh; align-items:center; justify-content:center;">
<div style="max-width:420px; padding:32px; text-align:center;">
<div style="font-size:22px; font-weight:800; letter-spacing:-0.5px;">Monivo</div>
<div style="height:4px; width:48px; background:#F5B83D; border-radius:2px; margin:12px auto 28px;"></div>
<h1 style="font-size:24px; margin:0 0 12px;">${title}</h1>
<p style="color:#8C95B0; line-height:1.5; margin:0;">${message}</p>
</div></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('u') ?? '';
  const kind = url.searchParams.get('k') ?? '';
  const sig = url.searchParams.get('s') ?? '';

  if (!userId || !(await verifyUnsubscribe(userId, kind, sig))) {
    return page('Link not valid', "This unsubscribe link doesn't look right. You can turn emails off in Monivo → Settings.", 400);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } =
    kind === 'budget_alert'
      ? await admin.from('budgets').update({ email_alerts: false }).eq('user_id', userId)
      : await admin.from('profiles').update({ notify_weekly_recap: false }).eq('id', userId);
  if (error) return page('Something went wrong', 'Please try again, or turn emails off in Monivo → Settings.', 500);

  return kind === 'budget_alert'
    ? page("You're unsubscribed", "We won't email you budget alerts any more. Turn them back on anytime in Monivo → Accounts → Budget.")
    : page("You're unsubscribed", "We won't send the weekly recap any more. Turn it back on anytime in Monivo → Settings → Notifications.");
});
