import nodemailer from 'npm:nodemailer@6';

// Gmail SMTP on port 465 (implicit TLS): Edge Functions block 25 and 587.
let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

/** `unsubscribeUrl` adds the List-Unsubscribe headers so Gmail can show its own one-click button. */
export async function sendEmail(to: string, subject: string, html: string, unsubscribeUrl?: string) {
  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  if (!user || !pass) throw new Error('Email sending is not configured (SMTP_USER / SMTP_PASS).');
  transport ??= nodemailer.createTransport({
    host: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transport.sendMail({
    from: { name: 'Monivo', address: user },
    to,
    subject,
    html,
    ...(unsubscribeUrl && {
      list: { unsubscribe: { url: unsubscribeUrl, comment: 'Unsubscribe' } },
      headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  });
}
