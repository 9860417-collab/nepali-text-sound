// Regenerates public/samples/<voice>.(mp3|wav) for every voice in src/lib/voices.ts.
// Gemini voices are generated only when GEMINI_API_KEY is set (read from .env.local).
// Usage: npm run samples            → all voices
//        npm run samples -- gemini  → only voices whose id contains "gemini" (comma-separate several)
//        npm run samples -- gemini --missing  → skip voices that already have a sample file
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { GeminiRateLimitError, geminiSpeak } from "../src/lib/gemini-tts";
import { SAMPLE_TEXT, VOICES, prosodyPercent, resolveVoice, sampleUrl } from "../src/lib/voices";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — fine for Edge voices
}

async function edgeSample(name: string, pitch: number, rate: number): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(name, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(SAMPLE_TEXT, {
      pitch: prosodyPercent(pitch, -50, 50),
      rate: prosodyPercent(rate, -50, 100),
    });
    const chunks: Buffer[] = [];
    for await (const c of audioStream) chunks.push(c as Buffer);
    return Buffer.concat(chunks);
  } finally {
    tts.close();
  }
}

/** Free tier allows only a few Gemini requests per minute — wait and retry on 429. */
async function withRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      // Only wait out short per-minute limits ("retry in 12s"); daily limits ("43m10s") fail fast.
      const wait = e instanceof GeminiRateLimitError ? /^(\d+)(?:\.\d+)?s$/.exec(e.retryIn ?? "") : null;
      if (i >= tries || !wait) throw e;
      const secs = Number(wait[1]) + 2;
      console.log(`  …rate limited, waiting ${secs}s`);
      await new Promise((r) => setTimeout(r, secs * 1000));
    }
  }
}

// Optional comma-separated filters; with --missing, existing sample files are kept.
const missingOnly = process.argv.includes("--missing");
const filters = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(",").split(",").filter(Boolean);
mkdirSync("public/samples", { recursive: true });
for (const { id } of VOICES) {
  if (filters.length && !filters.some((f) => id.includes(f))) continue;
  if (missingOnly && existsSync(`public${sampleUrl(id)}`)) continue;
  const voice = resolveVoice(id);
  if (voice.provider === "gemini" && !process.env.GEMINI_API_KEY) {
    console.log(`- ${id}: skipped (no GEMINI_API_KEY)`);
    continue;
  }
  try {
    const audio =
      voice.provider === "gemini"
        ? await withRetry(() => geminiSpeak(SAMPLE_TEXT, voice.name, ""))
        : await edgeSample(voice.name, voice.pitch, voice.rate);
    if (!audio.length) throw new Error("empty audio");
    writeFileSync(`public${sampleUrl(id)}`, audio);
    console.log(`✓ ${id} (${audio.length} bytes)`);
  } catch (e) {
    console.error(`✗ ${id}: ${(e as Error).message}`);
  }
}
process.exit(0);
