import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { GeminiConfigError, GeminiRateLimitError, geminiSpeak, geminiStyle } from "@/lib/gemini-tts";
import { VOICES, isVoiceId, prosodyPercent, resolveVoice } from "@/lib/voices";

const MAX_CHARS = 3000;

type TtsRequest = {
  text?: unknown;
  voice?: unknown;
  rate?: unknown; // percent, e.g. -20 or 15
  pitch?: unknown; // percent
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: Request) {
  let body: TtsRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "Text is required" }, { status: 400 });
  if (text.length > MAX_CHARS) {
    return Response.json({ error: `Text must be at most ${MAX_CHARS} characters` }, { status: 400 });
  }

  const voice = resolveVoice(isVoiceId(body.voice) ? body.voice : VOICES[0].id);
  // Style presets carry their own pitch/speed; the user's sliders adjust on top of them
  const rate = voice.rate + (Number(body.rate) || 0);
  const pitch = voice.pitch + (Number(body.pitch) || 0);

  if (voice.provider === "gemini") {
    try {
      // Gemini has no numeric pitch/speed; the sliders become a spoken-style hint.
      const audio = await geminiSpeak(text, voice.name, geminiStyle(rate, pitch));
      return new Response(new Uint8Array(audio), {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": String(audio.length),
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      if (err instanceof GeminiConfigError) {
        return Response.json({ error: err.message }, { status: 503 });
      }
      if (err instanceof GeminiRateLimitError) {
        const wait = err.retryIn ? ` Try again in ${err.retryIn.replace(/\.\d+s$/, "s")},` : " Try again later,";
        return Response.json(
          { error: `Gemini's free-tier limit is used up.${wait} or pick a Hemkala/Sagar voice (no limit).` },
          { status: 429 },
        );
      }
      console.error("Gemini TTS failed:", err);
      return Response.json(
        { error: "Gemini speech synthesis failed — check your API key and quota, then try again." },
        { status: 502 },
      );
    }
  }

  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice.name, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(escapeXml(text), {
      rate: prosodyPercent(rate, -50, 100),
      pitch: prosodyPercent(pitch, -50, 50),
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) chunks.push(chunk as Buffer);
    const audio = Buffer.concat(chunks);
    if (audio.length === 0) throw new Error("No audio returned from the TTS service");

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS failed:", err);
    return Response.json(
      { error: "Speech synthesis failed. The Edge TTS service may be unreachable — try again." },
      { status: 502 },
    );
  } finally {
    tts.close();
  }
}
