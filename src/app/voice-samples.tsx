"use client";

import { useEffect, useRef, useState } from "react";
import { GROUPS, GROUP_NOTES, SAMPLE_TEXT, VOICES, sampleUrl, type VoiceId } from "@/lib/voices";

type Props = {
  selected: VoiceId;
  onSelect: (id: VoiceId) => void;
};

export function VoiceSamples({ selected, onSelect }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveUrls = useRef(new Map<VoiceId, string>());
  const [playing, setPlaying] = useState<VoiceId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urls = liveUrls.current;
    return () => {
      audioRef.current?.pause();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  /** No pre-generated file (e.g. Gemini samples not built yet) → synthesize the sample live. */
  async function liveSample(id: VoiceId): Promise<string> {
    const cached = liveUrls.current.get(id);
    if (cached) return cached;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: SAMPLE_TEXT, voice: id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Request failed (${res.status})`);
    }
    const url = URL.createObjectURL(await res.blob());
    liveUrls.current.set(id, url);
    return url;
  }

  function play(id: VoiceId, src: string, fallback: boolean) {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onended = () => setPlaying((p) => (p === id ? null : p));
    audio.onerror = () => {
      if (audioRef.current !== audio) return;
      if (!fallback) return setPlaying(null);
      liveSample(id)
        .then((url) => audioRef.current === audio && play(id, url, false))
        .catch((e: Error) => {
          setError(e.message);
          setPlaying(null);
        });
    };
    audio.play().catch(() => {}); // load errors are handled by onerror
  }

  function toggle(id: VoiceId) {
    audioRef.current?.pause();
    setError(null);
    if (playing === id) {
      audioRef.current = null;
      setPlaying(null);
      return;
    }
    setPlaying(id);
    play(id, liveUrls.current.get(id) ?? sampleUrl(id), true);
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-panel p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Voice samples</h2>
      <p className="mt-1 text-sm text-muted">
        Each sample reads: <span lang="ne" className="font-nepali text-foreground">{SAMPLE_TEXT}</span>
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-5">
        {GROUPS.map((group) => (
          <div key={group}>
            <h3 className="text-sm font-medium">
              {group} <span className="font-normal text-muted">· {GROUP_NOTES[group]}</span>
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {VOICES.filter((v) => v.group === group).map((v) => {
                const isSelected = v.id === selected;
                const isPlaying = v.id === playing;
                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                      isSelected ? "border-accent bg-accent/5" : "border-line bg-background"
                    }`}
                  >
                    <button
                      onClick={() => toggle(v.id)}
                      aria-label={`${isPlaying ? "Stop" : "Play"} ${v.label} sample`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:opacity-90"
                    >
                      {isPlaying ? "■" : "▶"}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{v.label}</div>
                      <div className="text-xs text-muted">{v.gender}</div>
                    </div>
                    <button
                      onClick={() => onSelect(v.id)}
                      disabled={isSelected}
                      className="rounded-lg border border-line px-3 py-1 text-xs hover:bg-hover disabled:border-accent disabled:text-accent"
                    >
                      {isSelected ? "Selected" : "Use"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
