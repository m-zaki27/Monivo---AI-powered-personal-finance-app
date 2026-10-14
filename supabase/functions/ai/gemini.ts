/**
 * Minimal Gemini client: one call that returns JSON matching a schema.
 * The key and model come from Supabase secrets, so they never reach the app.
 */

export class AiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * Tried in order. Free-tier models are sometimes overloaded ("high demand",
 * 503) or rate-limited (429); falling back to a sibling model keeps the
 * feature working instead of failing the user. Override with GEMINI_MODELS.
 */
const MODELS = (Deno.env.get('GEMINI_MODELS') ?? 'gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

/** Worth trying another model: overloaded, rate-limited, or a temporary server error. */
const RETRYABLE = new Set([429, 500, 503, 504]);
/** A free-tier model under load can stall for minutes; give up on it and try the next. */
const ATTEMPT_TIMEOUT_MS = 25_000;

export async function generateJson<T>(opts: {
  system: string;
  parts: Part[];
  /** OpenAPI-style schema (Gemini's responseSchema format). */
  schema: Record<string, unknown>;
  temperature?: number;
}): Promise<T> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new AiError("Monivo's AI isn't set up yet.", 503);

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: 'user', parts: opts.parts }],
    generationConfig: {
      // Low temperature: we want faithful extraction, not creativity.
      temperature: opts.temperature ?? 0.2,
      responseMimeType: 'application/json',
      responseSchema: opts.schema,
      // These are simple extraction/phrasing jobs; deep "thinking" only adds latency.
      thinkingConfig: { thinkingLevel: 'low' },
    },
  });

  let res: Response | null = null;
  for (const model of MODELS) {
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
    } catch {
      console.warn('Gemini timed out, trying next model', model);
      res = null;
      continue;
    }
    if (res.ok || !RETRYABLE.has(res.status)) break;
    // Log Google's error (it never contains the user's data) to the function logs.
    console.warn('Gemini unavailable, trying next model', model, res.status);
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 503;
    console.error('Gemini error', status, res ? await res.text() : 'timed out');
    if (RETRYABLE.has(status)) throw new AiError("Monivo's AI is busy right now. Try again in a minute.", 503);
    throw new AiError("The AI couldn't handle that. Please try again.", 502);
  }

  const json = await res.json();
  const text: string | undefined = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) throw new AiError("The AI didn't return an answer. Please try again.", 502);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiError("The AI's answer didn't make sense. Please try again.", 502);
  }
}
