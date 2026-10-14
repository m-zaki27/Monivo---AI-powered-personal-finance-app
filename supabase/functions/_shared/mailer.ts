import nodemailer from 'npm:nodemailer@6';

/**
 * Sends email through the Gmail account set in Supabase secrets
 * (SMTP_USER + SMTP_PASS, a Google App Password). Port 465 (implicit TLS):
 * Edge Functions block ports 25 and 587.
 */
let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

export async function sendEmail(to: string, subject: string, html: string) {
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
  });
}
