// Native apps ignore CORS; only these web origins may call the functions from a browser.
// Override with the ALLOWED_ORIGINS secret (comma-separated) when a web build is deployed.
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:8081')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

/** Wraps a handler: answers preflight and adds CORS headers only for allowed origins. */
export function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin') ?? '';
    const headers: Record<string, string> = allowedOrigins.includes(origin)
      ? { ...corsHeaders, 'Access-Control-Allow-Origin': origin }
      : corsHeaders;
    if (req.method === 'OPTIONS') return new Response('ok', { headers });
    const res = await handler(req);
    for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
    return res;
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    // Financial data: never cache, never sniff.
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

/** Constant-time string comparison, so timing doesn't leak how much of a secret matched. */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
