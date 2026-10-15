/** HMAC-signed unsubscribe links, so nobody can unsubscribe someone else by editing the URL. */

export type UnsubscribeKind = 'budget_alert' | 'weekly_recap';

async function hmac(message: string): Promise<string> {
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function unsubscribeUrl(userId: string, kind: UnsubscribeKind): Promise<string> {
  const sig = await hmac(`${userId}:${kind}`);
  const base = `${Deno.env.get('SUPABASE_URL')}/functions/v1/unsubscribe`;
  return `${base}?u=${encodeURIComponent(userId)}&k=${kind}&s=${sig}`;
}

/** Constant-time comparison, so response timing doesn't leak the signature. */
export async function verifyUnsubscribe(userId: string, kind: string, sig: string): Promise<boolean> {
  if (kind !== 'budget_alert' && kind !== 'weekly_recap') return false;
  const expected = await hmac(`${userId}:${kind}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
