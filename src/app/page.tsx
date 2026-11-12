"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasLatin, toDevanagari } from "@/lib/transliterate";
import { GROUPS, VOICES, type VoiceId } from "@/lib/voices";
import { VoiceSamples } from "./voice-samples";

const EXAMPLES = [
  "Namaste! Mero naam Ram ho. Tapai lai kasto cha?",
  "नमस्ते! म नेपालबाट हुँ।",
  "Ma {computer} ma kaam garchu.",
];

export default function Home() {
  const [input, setInput] = useState(EXAMPLES[0]);
  const [transliterate, setTransliterate] = useState(true);
  const [edited, setEdited] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceId>(VOICES[0].id);
  const [rate, setRate] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioExt, setAudioExt] = useState("mp3");
  const audioRef = useRef<HTMLAudioElement>(null);

  const converted = useMemo(
    () => (transliterate ? toDevanagari(input) : input),
    [input, transliterate],
  );
  const spoken = edited ?? converted;

  // Free the previous audio blob when a new one replaces it
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  function updateInput(value: string) {
    setInput(value);
    setEdited(null); // new input → drop manual edits to the preview
  }

  async function speak() {
    if (!spoken.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spoken, voice, rate, pitch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      setAudioExt(blob.type.includes("wav") ? "wav" : "mp3");
      setAudioUrl(URL.createObjectURL(blob));
      requestAnimationFrame(() => audioRef.current?.play());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Nepali Text to Speech <span className="text-muted">· नेपाली आवाज</span>
        </h1>
        <p className="mt-2 text-muted">
          Type in Roman letters or Devanagari. Roman text is converted to Devanagari so the
          Nepali voice pronounces it correctly.
        </p>
      </header>

      <section className="space-y-6 rounded-2xl border border-line bg-panel p-5 sm:p-6">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="input" className="text-sm font-medium">
              Your text (English letters or देवनागरी)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex}
                  onClick={() => updateInput(ex)}
                  className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:bg-hover"
                >
                  Example {i + 1}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="input"
            value={input}
            onChange={(e) => updateInput(e.target.value)}
            rows={4}
            maxLength={3000}
            className="w-full resize-y rounded-xl border border-line bg-background p-3 text-lg outline-none focus:ring-2 focus:ring-accent"
            placeholder="e.g. Namaste, tapai lai kasto cha?"
          />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={transliterate}
              onChange={(e) => {
                setTransliterate(e.target.checked);
                setEdited(null);
              }}
              className="accent-[var(--accent)]"
            />
            Convert Roman letters to Devanagari
            <span className="text-muted">
              (wrap English words in {"{braces}"} to keep them as-is)
            </span>
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="preview" className="text-sm font-medium">
              What will be spoken {edited !== null && <span className="text-muted">(edited)</span>}
            </label>
            {edited !== null && (
              <button onClick={() => setEdited(null)} className="text-xs text-accent hover:underline">
                Reset to auto
              </button>
            )}
          </div>
          <textarea
            id="preview"
            value={spoken}
            onChange={(e) => setEdited(e.target.value)}
            rows={3}
            lang="ne"
            className="w-full resize-y rounded-xl border border-line bg-background p-3 font-nepali text-xl outline-none focus:ring-2 focus:ring-accent"
          />
          {transliterate && hasLatin(input) && (
            <p className="mt-1 text-xs text-muted">
              Spelling not quite right? Edit it here before speaking.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Voice</span>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoiceId)}
              className="w-full rounded-lg border border-line bg-background p-2"
            >
              {GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {VOICES.filter((v) => v.group === group).map((v) => (
                    <option key={v.id} value={v.id}>{v.label} ({v.gender})</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Speed: {rate > 0 ? "+" : ""}{rate}%</span>
            <input type="range" min={-50} max={100} step={5} value={rate}
              onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Pitch: {pitch > 0 ? "+" : ""}{pitch}%</span>
            <input type="range" min={-50} max={50} step={5} value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={speak}
            disabled={loading || !spoken.trim()}
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Generating…" : "🔊 Speak / बोल्नुहोस्"}
          </button>
          {audioUrl && (
            <a href={audioUrl} download={`nepali-speech.${audioExt}`} className="text-sm text-accent hover:underline">
              Download {audioExt.toUpperCase()}
            </a>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {audioUrl && <audio ref={audioRef} src={audioUrl} controls className="w-full" />}
      </section>

      <VoiceSamples selected={voice} onSelect={setVoice} />

      <details className="mt-8 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-foreground">Typing tips</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li><code>aa</code> → ा, <code>ee</code>/<code>ii</code> → ी, <code>oo</code>/<code>uu</code> → ू, <code>ai</code> → ै, <code>au</code> → ौ</li>
          <li><code>chh</code> or <code>x</code> → छ, <code>sh</code> → श, <code>Sh</code> → ष</li>
          <li>Uppercase inside a word for retroflex: <code>T</code> ट, <code>Th</code> ठ, <code>D</code> ड, <code>Dh</code> ढ, <code>N</code> ण</li>
          <li><code>~</code> → ँ (chandrabindu), <code>M</code> → ं (anusvara), <code>.</code> → ।</li>
          <li>Common words like <em>tapai, cha, ramro, dhanyabad</em> use built-in correct spellings.</li>
        </ul>
      </details>
    </main>
  );
}
