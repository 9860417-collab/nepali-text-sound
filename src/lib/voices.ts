export type VoiceGroup = "Nepali" | "Nepali styles" | "Gemini AI" | "Hindi" | "Marathi" | "Multilingual";

type Voice = {
  id: string;
  label: string;
  gender: string;
  group: VoiceGroup;
  /** Microsoft voice that actually speaks. Defaults to `id`. */
  base?: string;
  /** Built-in pitch/speed offsets in %, added on top of the user's sliders. */
  pitch?: number;
  rate?: number;
  /** Which TTS service speaks this voice. Defaults to Microsoft Edge. */
  provider?: "edge" | "gemini";
};

export const VOICES = [
  { id: "ne-NP-HemkalaNeural", label: "Hemkala", gender: "Female", group: "Nepali" },
  { id: "ne-NP-SagarNeural", label: "Sagar", gender: "Male", group: "Nepali" },

  // Presets on the two Nepali voices (Microsoft has no other Nepali voices)
  { id: "ne-hemkala-young", label: "Young woman", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: 12, rate: 8 },
  { id: "ne-hemkala-calm", label: "Calm narrator", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: -6, rate: -15 },
  { id: "ne-hemkala-child", label: "Child", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: 30, rate: 5 },
  { id: "ne-sagar-deep", label: "Deep voice", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: -15, rate: -5 },
  { id: "ne-sagar-energetic", label: "Energetic", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: 8, rate: 18 },
  { id: "ne-sagar-elder", label: "Elder", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: -20, rate: -22 },
  { id: "ne-hemkala-teen", label: "Teenage girl", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: 20, rate: 12 },
  { id: "ne-hemkala-cheerful", label: "Cheerful", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: 15, rate: 18 },
  { id: "ne-hemkala-news", label: "Newsreader", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: -3, rate: 12 },
  { id: "ne-hemkala-storyteller", label: "Storyteller", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: 4, rate: -10 },
  { id: "ne-hemkala-grandmother", label: "Grandmother", gender: "Female · Hemkala", group: "Nepali styles",
    base: "ne-NP-HemkalaNeural", pitch: -14, rate: -22 },
  { id: "ne-sagar-boy", label: "Boy", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: 30, rate: 8 },
  { id: "ne-sagar-young", label: "Young man", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: 10, rate: 6 },
  { id: "ne-sagar-news", label: "Newsreader", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: -5, rate: 12 },
  { id: "ne-sagar-storyteller", label: "Storyteller", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: -8, rate: -12 },
  { id: "ne-sagar-fast", label: "Fast talker", gender: "Male · Sagar", group: "Nepali styles",
    base: "ne-NP-SagarNeural", pitch: 0, rate: 35 },

  // Google Gemini voices — need GEMINI_API_KEY; base = Gemini voice name
  { id: "gemini-kore", label: "Kore", gender: "Female · Firm", group: "Gemini AI", base: "Kore", provider: "gemini" },
  { id: "gemini-zephyr", label: "Zephyr", gender: "Female · Bright", group: "Gemini AI", base: "Zephyr", provider: "gemini" },
  { id: "gemini-leda", label: "Leda", gender: "Female · Youthful", group: "Gemini AI", base: "Leda", provider: "gemini" },
  { id: "gemini-aoede", label: "Aoede", gender: "Female · Breezy", group: "Gemini AI", base: "Aoede", provider: "gemini" },
  { id: "gemini-achernar", label: "Achernar", gender: "Female · Soft", group: "Gemini AI", base: "Achernar", provider: "gemini" },
  { id: "gemini-sulafat", label: "Sulafat", gender: "Female · Warm", group: "Gemini AI", base: "Sulafat", provider: "gemini" },
  { id: "gemini-vindemiatrix", label: "Vindemiatrix", gender: "Female · Gentle", group: "Gemini AI", base: "Vindemiatrix", provider: "gemini" },
  { id: "gemini-gacrux", label: "Gacrux", gender: "Female · Mature", group: "Gemini AI", base: "Gacrux", provider: "gemini" },
  { id: "gemini-puck", label: "Puck", gender: "Male · Upbeat", group: "Gemini AI", base: "Puck", provider: "gemini" },
  { id: "gemini-charon", label: "Charon", gender: "Male · Informative", group: "Gemini AI", base: "Charon", provider: "gemini" },
  { id: "gemini-fenrir", label: "Fenrir", gender: "Male · Excitable", group: "Gemini AI", base: "Fenrir", provider: "gemini" },
  { id: "gemini-orus", label: "Orus", gender: "Male · Firm", group: "Gemini AI", base: "Orus", provider: "gemini" },
  { id: "gemini-iapetus", label: "Iapetus", gender: "Male · Clear", group: "Gemini AI", base: "Iapetus", provider: "gemini" },
  { id: "gemini-algenib", label: "Algenib", gender: "Male · Gravelly", group: "Gemini AI", base: "Algenib", provider: "gemini" },
  { id: "gemini-achird", label: "Achird", gender: "Male · Friendly", group: "Gemini AI", base: "Achird", provider: "gemini" },
  { id: "gemini-sadaltager", label: "Sadaltager", gender: "Male · Knowledgeable", group: "Gemini AI", base: "Sadaltager", provider: "gemini" },

  { id: "hi-IN-SwaraNeural", label: "Swara", gender: "Female", group: "Hindi" },
  { id: "hi-IN-MadhurNeural", label: "Madhur", gender: "Male", group: "Hindi" },
  { id: "mr-IN-AarohiNeural", label: "Aarohi", gender: "Female", group: "Marathi" },
  { id: "mr-IN-ManoharNeural", label: "Manohar", gender: "Male", group: "Marathi" },
  { id: "en-US-AvaMultilingualNeural", label: "Ava", gender: "Female", group: "Multilingual" },
  { id: "en-US-EmmaMultilingualNeural", label: "Emma", gender: "Female", group: "Multilingual" },
  { id: "en-US-AndrewMultilingualNeural", label: "Andrew", gender: "Male", group: "Multilingual" },
  { id: "en-US-BrianMultilingualNeural", label: "Brian", gender: "Male", group: "Multilingual" },
] as const satisfies readonly Voice[];

export const GROUP_NOTES: Record<VoiceGroup, string> = {
  Nepali: "Native Nepali voices — most natural pronunciation.",
  "Nepali styles": "The native voices with tuned pitch and speed, for more character variety.",
  "Gemini AI": "Google's AI voices speaking Nepali — more expressive. Needs a Gemini API key.",
  Hindi: "Read Devanagari fluently, with a Hindi accent.",
  Marathi: "Read Devanagari fluently, with a Marathi accent.",
  Multilingual: "Experimental — American voices that attempt other languages; expect a foreign accent.",
};

export const GROUPS = Object.keys(GROUP_NOTES) as VoiceGroup[];

export type VoiceId = (typeof VOICES)[number]["id"];

export function isVoiceId(v: unknown): v is VoiceId {
  return VOICES.some((voice) => voice.id === v);
}

/** Resolves a voice id to the Microsoft voice name plus its built-in pitch/rate offsets. */
export function resolveVoice(id: VoiceId): {
  name: string; pitch: number; rate: number; provider: "edge" | "gemini";
} {
  const v: Voice = VOICES.find((voice) => voice.id === id) ?? VOICES[0];
  return { name: v.base ?? v.id, pitch: v.pitch ?? 0, rate: v.rate ?? 0, provider: v.provider ?? "edge" };
}

/** Pre-generated sample (public/samples) speaking SAMPLE_TEXT. Gemini samples are WAV. */
export const sampleUrl = (id: VoiceId) =>
  `/samples/${id}.${resolveVoice(id).provider === "gemini" ? "wav" : "mp3"}`;
export const SAMPLE_TEXT = "नमस्ते! मेरो नाम राम हो। तपाईंलाई कस्तो छ? आज मौसम धेरै राम्रो छ।";

/** Formats a percentage offset for SSML prosody, clamped to [min, max]. */
export function prosodyPercent(value: number, min: number, max: number): string {
  const n = Math.min(max, Math.max(min, Math.round(value)));
  return `${n >= 0 ? "+" : ""}${n}%`;
}
