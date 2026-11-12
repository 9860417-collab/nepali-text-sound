// Gemini text-to-speech via the Interactions API. Returns WAV audio (24 kHz, 16-bit, mono).
// Needs GEMINI_API_KEY; GEMINI_TTS_MODEL optionally overrides the main model.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const DEFAULT_MODEL = "gemini-3.8-flash-tts";
/** Has its own (separate) free-tier quota, so it's used when the main model is rate limited. */
const FALLBACK_MODEL = "gemini-3.8-flash-lite-tts";

export class GeminiConfigError extends Error {}

export class GeminiRateLimitError extends Error {
  constructor(message: string, readonly retryIn: string | null) {
    super(message);
  }
}

/** Turns the speed/pitch slider offsets (in %) into a natural-language style hint. */
export function geminiStyle(rate: number, pitch: number, base = ""): string {
  const parts = base ? [base] : [];
  if (rate >= 40) parts.push("speaking very quickly");
  else if (rate >= 15) parts.push("speaking quickly");
  else if (rate <= -30) parts.push("speaking very slowly");
  else if (rate <= -10) parts.push("speaking slowly");
  if (pitch >= 15) parts.push("higher pitch");
  else if (pitch <= -15) parts.push("lower pitch");
  return parts.join(", ");
}

type InteractionResponse = {
  steps?: { type?: string; content?: { type?: string; data?: string }[] }[];
  error?: { message?: string };
};

export async function geminiSpeak(text: string, voice: string, style: string): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiConfigError(
      "Gemini voices need an API key. Add GEMINI_API_KEY=... to .env.local and restart the server.",
    );
  }

  const content: Record<string, unknown> = { type: "text", text };
  if (style) content.annotations = [{ type: "speech_metadata", style }];

  const models = [...new Set([process.env.GEMINI_TTS_MODEL || DEFAULT_MODEL, FALLBACK_MODEL])];
  let limited: GeminiRateLimitError | undefined;
  for (const model of models) {
    try {
      return await request(key, model, content, voice);
    } catch (e) {
      if (!(e instanceof GeminiRateLimitError)) throw e;
      limited = e; // try the next model's quota
    }
  }
  throw limited!;
}

async function request(
  key: string,
  model: string,
  content: Record<string, unknown>,
  voice: string,
): Promise<Buffer> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      model,
      input: [{ type: "user_input", content: [content] }],
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice }] },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as InteractionResponse;
  const message = `Gemini TTS ${res.status} (${model}): ${data.error?.message ?? "request failed"}`;
  if (res.status === 429) {
    throw new GeminiRateLimitError(message, /retry in ([\dhms.]+)/i.exec(message)?.[1] ?? null);
  }
  if (!res.ok) throw new Error(message);

  const audio = (data.steps ?? [])
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === "audio" && c.data)
    .at(-1)?.data;
  if (!audio) throw new Error("Gemini TTS returned no audio");
  return Buffer.from(audio, "base64");
}
