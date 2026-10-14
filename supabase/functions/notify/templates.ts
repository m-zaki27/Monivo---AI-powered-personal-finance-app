/**
 * The two notification emails as functions. Same design as emails/*.html
 * (the static previews): 600px, table-based, inline styles, navy header with
 * gold accent, Outlook-safe button, Apple Mail dark mode. Anything that came
 * from a user (names, merchants) is HTML-escaped.
 */

const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const NUM = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";
const LOGO_URL = 'https://mipycjyywonzhgkgcyfc.supabase.co/storage/v1/object/public/assets/logo-mark-gold@2x.png';
const CATEGORY_HEX: Record<string, string> = {
  cobalt: '#2F6BFF', sky: '#3BC9F5', rose: '#FF4D79', amber: '#FF9F1C', gold: '#F5B83D',
  pink: '#FF7AB8', teal: '#17B7C9', orange: '#F2702C', tan: '#C79A68', steel: '#6F8CC9',
};

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function shell(opts: { title: string; preheader: string; header: string; body: string; footer: string }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${esc(opts.title)}</title>
<!--[if mso]><style>table, td, h1, h2, p, a, span { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; }
  table { border-collapse: collapse; } img { border: 0; display: block; } a { text-decoration: none; }
  @media screen and (max-width: 620px) { .container { width: 100% !important; } .px { padding-left: 24px !important; padding-right: 24px !important; } .stat { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; } }
  @media (prefers-color-scheme: dark) {
    .bg-page { background-color: #0B1020 !important; } .bg-card { background-color: #131A2E !important; } .bg-raised { background-color: #1C2540 !important; }
    .text-ink { color: #F4F1EA !important; } .text-muted { color: #8C95B0 !important; } .track { background-color: #2A3556 !important; } .divider { border-color: rgba(255,255,255,0.08) !important; }
  }
</style>
</head>
<body class="bg-page" style="margin:0; padding:0; background-color:#F3EFE6;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background-color:#F3EFE6;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px; max-width:600px;">
  <tr><td class="px" style="background-color:#0E1630; border-radius:24px 24px 0 0; padding:28px 40px; font-family:${FONT};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="vertical-align:middle; padding-right:10px;"><img src="${LOGO_URL}" width="36" height="36" alt="Monivo" style="width:36px; height:36px;"></td>
      <td style="vertical-align:middle; font-size:22px; font-weight:800; letter-spacing:-0.5px; color:#F4F1EA;">Monivo</td>
    </tr></table>
    ${opts.header}
  </td></tr>
  <tr><td style="background-color:#F5B83D; height:4px; line-height:4px; font-size:4px;">&nbsp;</td></tr>
  <tr><td class="bg-card px" style="background-color:#FFFFFF; padding:32px 40px 8px 40px; font-family:${FONT};">${opts.body}</td></tr>
  <tr><td class="bg-card divider px" style="background-color:#FFFFFF; border-top:1px solid rgba(20,24,43,0.08); border-radius:0 0 24px 24px; padding:24px 40px 32px 40px; font-family:${FONT};">${opts.footer}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** "Bulletproof" button: Outlook draws the VML shape, everyone else gets the styled link. */
function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 40px 0;"><tr><td align="center" style="border-radius:999px; background-color:#F5B83D;">
<!--[if mso]><v:roundrect href="${href}" style="height:52px; v-text-anchor:middle; width:240px;" arcsize="50%" stroke="f" fillcolor="#F5B83D"><w:anchorlock/><center style="color:#0B1020; font-family:Arial, sans-serif; font-size:16px; font-weight:bold;">${esc(label)}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${href}" style="display:inline-block; padding:16px 36px; border-radius:999px; background-color:#F5B83D; font-family:${FONT}; font-size:16px; line-height:20px; font-weight:700; color:#0B1020;">${esc(label)}</a><!--<![endif]-->
</td></tr></table>`;
}

function bar(percent: number, color: string, height = 10) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const fill = `<td width="${Math.max(p, 1)}%" style="background-color:${color}; height:${height}px; line-height:${height}px; font-size:${height}px; border-radius:${p >= 100 ? '999px' : '999px 0 0 999px'};">&nbsp;</td>`;
  const rest = p < 100 ? `<td class="track" width="${100 - p}%" style="background-color:#E6E0D3; height:${height}px; line-height:${height}px; font-size:${height}px; border-radius:0 999px 999px 0;">&nbsp;</td>` : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${fill}${rest}</tr></table>`;
}

function footer(reason: string, settingsLabel: string, unsubscribeUrl: string, email: string) {
  return `<p class="text-muted" style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#6B7390;">${esc(reason)} You can change this in Monivo → ${esc(settingsLabel)}, or <a href="${unsubscribeUrl}" style="color:#2F6BFF; font-weight:600;">unsubscribe in one tap</a>.</p>
<p class="text-muted" style="margin:0; font-size:12px; line-height:18px; color:#6B7390;">Monivo · Sent to ${esc(email)}</p>`;
}

// ---------------------------------------------------------------------------

export interface BudgetAlertData {
  firstName: string;
  email: string;
  monthName: string;
  usedPercent: number;
  thresholdPercent: number;
  spent: string;
  limit: string;
  remaining: string;
  daysLeft: number;
  perDay: string;
  over: boolean;
  topCategories: { name: string; amount: string; color: string }[];
  appUrl: string;
  unsubscribeUrl: string;
}

export function budgetAlertEmail(d: BudgetAlertData) {
  const name = d.firstName ? `Hi ${esc(d.firstName)}, ` : '';
  const title = d.over ? `You've gone over your ${d.monthName} budget` : `You've used ${d.usedPercent}% of your ${d.monthName} budget`;
  const accent = d.over ? '#FF4D79' : '#FF9F1C';
  const rows = d.topCategories
    .map(
      (c, i) => `<tr><td class="divider" style="padding:12px 0;${i < d.topCategories.length - 1 ? ' border-bottom:1px solid rgba(20,24,43,0.08);' : ''}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="22" style="vertical-align:middle;"><div style="width:12px; height:12px; border-radius:6px; background-color:${CATEGORY_HEX[c.color] ?? '#C79A68'};"></div></td>
<td class="text-ink" style="vertical-align:middle; font-size:15px; line-height:22px; font-weight:600; color:#14182B;">${esc(c.name)}</td>
<td align="right" class="text-ink" style="vertical-align:middle; font-family:${NUM}; font-size:15px; font-weight:700; color:#14182B;">${esc(c.amount)}</td>
</tr></table></td></tr>`,
    )
    .join('');

  const body = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:${d.over ? '#FFE3EA' : '#FFF1DC'}; border-radius:999px; padding:6px 12px; font-size:12px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase; color:${d.over ? '#C21E4B' : '#B86A00'};">&#9888;&nbsp; Budget alert</td></tr></table>
<h1 class="text-ink" style="margin:20px 0 8px 0; font-size:28px; line-height:36px; font-weight:800; letter-spacing:-0.6px; color:#14182B;">${name}${esc(title)}</h1>
<p class="text-muted" style="margin:0 0 28px 0; font-size:16px; line-height:24px; color:#6B7390;">You asked us to let you know at ${d.thresholdPercent}%. Here's where things stand.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-raised" style="background-color:#F3EFE6; border-radius:24px;"><tr><td style="padding:24px;">
  <p class="text-muted" style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#6B7390;">Spent so far</p>
  <p class="text-ink" style="margin:0; font-family:${NUM}; font-size:44px; line-height:50px; font-weight:700; letter-spacing:-1.5px; color:#14182B;">${esc(d.spent)}</p>
  <p class="text-muted" style="margin:2px 0 18px 0; font-size:15px; line-height:22px; font-weight:600; color:#6B7390;">of your ${esc(d.limit)} monthly budget</p>
  ${bar(d.usedPercent, accent)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;"><tr>
    <td style="font-size:13px; font-weight:700; color:${d.over ? '#C21E4B' : '#B86A00'};">${d.usedPercent}% used</td>
    <td align="right" class="text-muted" style="font-size:13px; color:#6B7390;">Alert set at ${d.thresholdPercent}%</td>
  </tr></table>
</td></tr></table>
<p class="text-ink" style="margin:24px 0 0 0; font-size:16px; line-height:24px; color:#14182B;">${
    d.over
      ? `You're <strong>${esc(d.remaining)} over</strong> with ${d.daysLeft} ${d.daysLeft === 1 ? 'day' : 'days'} to go. Holding off on extras will help.`
      : `You have <strong>${esc(d.remaining)} left</strong> for the next <strong>${d.daysLeft} ${d.daysLeft === 1 ? 'day' : 'days'}</strong>. That's about <strong style="font-family:${NUM};">${esc(d.perDay)} a day</strong>.`
  }</p>
${rows ? `<p class="text-muted" style="margin:32px 0 12px 0; font-size:12px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#6B7390;">Biggest spending this month</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>` : ''}
${button('See my budget', d.appUrl)}`;

  return {
    subject: title,
    html: shell({
      title,
      preheader: d.over ? `You're ${d.remaining} over budget this month.` : `${d.remaining} left for the next ${d.daysLeft} days.`,
      header: '',
      body,
      footer: footer("You're getting this because budget alerts are on.", 'Accounts → Budget', d.unsubscribeUrl, d.email),
    }),
  };
}

// ---------------------------------------------------------------------------

export interface WeeklyRecapData {
  firstName: string;
  email: string;
  weekLabel: string;
  headline: string;
  spent: string;
  changeLabel: string | null;
  changeDown: boolean;
  income: string;
  budgetLabel: string;
  topCategories: { name: string; amount: string; count: number; color: string; percent: number }[];
  tips: { title: string; body: string }[];
  appUrl: string;
  unsubscribeUrl: string;
}

export function weeklyRecapEmail(d: WeeklyRecapData) {
  const stat = (label: string, value: string, sub: string, valueColor = '#14182B', subColor = '#6B7390') =>
    `<td class="stat" width="33%" style="padding:0 4px; vertical-align:top;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-raised" style="background-color:#F3EFE6; border-radius:16px;"><tr><td style="padding:16px;">
<p class="text-muted" style="margin:0 0 4px 0; font-size:12px; font-weight:600; color:#6B7390;">${label}</p>
<p class="${valueColor === '#14182B' ? 'text-ink' : ''}" style="margin:0; font-family:${NUM}; font-size:22px; line-height:28px; font-weight:700; letter-spacing:-0.6px; color:${valueColor};">${esc(value)}</p>
<p style="margin:4px 0 0 0; font-size:12px; line-height:16px; font-weight:700; color:${subColor};">${esc(sub)}</p>
</td></tr></table></td>`;

  const cats = d.topCategories
    .map(
      (c, i) => `<tr><td class="divider" style="padding:14px 0;${i < d.topCategories.length - 1 ? ' border-bottom:1px solid rgba(20,24,43,0.08);' : ''}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td width="44" style="vertical-align:middle;"><div style="width:32px; height:32px; border-radius:16px; background-color:#F3EFE6; text-align:center; font-size:14px; line-height:32px; font-weight:800; color:#14182B;">${i + 1}</div></td>
<td style="vertical-align:middle;"><p class="text-ink" style="margin:0; font-size:15px; line-height:22px; font-weight:700; color:#14182B;">${esc(c.name)}</p>
<p class="text-muted" style="margin:0; font-size:12px; line-height:16px; color:#6B7390;">${c.count} ${c.count === 1 ? 'transaction' : 'transactions'}</p></td>
<td align="right" class="text-ink" style="vertical-align:middle; font-family:${NUM}; font-size:16px; font-weight:700; color:#14182B;">${esc(c.amount)}</td></tr>
<tr><td></td><td colspan="2" style="padding-top:8px;">${bar(c.percent, CATEGORY_HEX[c.color] ?? '#C79A68', 6)}</td></tr>
</table></td></tr>`,
    )
    .join('');

  const tips = d.tips
    .map(
      (t, i) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-raised" style="background-color:#F3EFE6; border-radius:16px;${i ? ' margin-top:12px;' : ''}"><tr>
<td width="4" style="background-color:#F5B83D; border-radius:16px 0 0 16px; font-size:0; line-height:0;">&nbsp;</td>
<td style="padding:16px 20px;"><p class="text-ink" style="margin:0 0 4px 0; font-size:15px; line-height:22px; font-weight:700; color:#14182B;">${esc(t.title)}</p>
<p class="text-muted" style="margin:0; font-size:14px; line-height:21px; color:#6B7390;">${esc(t.body)}</p></td></tr></table>`,
    )
    .join('');

  const header = `<p style="margin:28px 0 6px 0; font-size:12px; line-height:16px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#F5B83D;">Weekly recap · ${esc(d.weekLabel)}</p>
<h1 style="margin:0; font-size:28px; line-height:36px; font-weight:800; letter-spacing:-0.6px; color:#F4F1EA;">${esc(d.headline)}</h1>`;

  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${stat('Spent', d.spent, d.changeLabel ?? 'this week', '#14182B', d.changeLabel ? (d.changeDown ? '#0E8FB8' : '#C21E4B') : '#6B7390')}
${stat('Income', d.income, 'this week', '#0E8FB8')}
${stat('Budget', d.budgetLabel, 'this month')}
</tr></table>
${cats ? `<h2 class="text-ink" style="margin:32px 0 4px 0; font-size:18px; line-height:24px; font-weight:700; color:#14182B;">Where it went</h2><p class="text-muted" style="margin:0 0 8px 0; font-size:14px; color:#6B7390;">Your top categories this week</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cats}</table>` : ''}
${tips ? `<h2 class="text-ink" style="margin:32px 0 12px 0; font-size:18px; line-height:24px; font-weight:700; color:#14182B;">Ideas for this week</h2>${tips}` : ''}
${button('Open Monivo', d.appUrl)}`;

  return {
    subject: `Your week in money: ${d.weekLabel}`,
    html: shell({
      title: `Your week in money: ${d.weekLabel}`,
      preheader: `You spent ${d.spent} last week.`,
      header,
      body,
      footer: footer('You get this recap every Monday.', 'Settings → Notifications', d.unsubscribeUrl, d.email),
    }),
  };
}
