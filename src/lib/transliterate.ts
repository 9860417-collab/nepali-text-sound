/**
 * Romanized Nepali → Devanagari transliterator.
 *
 * - Devanagari already in the text passes through unchanged, so mixed input works.
 * - Text wrapped in {curly braces} is kept as-is (e.g. English words like {computer}).
 * - Common words come from a dictionary, because casual spellings are ambiguous
 *   ("tapai" → तपाईं, not तपै). Everything else goes through phonetic rules.
 * - Uppercase T, Th, D, Dh, N inside a word give retroflex ट ठ ड ढ ण; lowercase gives
 *   dental त थ द ध न. Use `sh` for श and `Sh` for ष (the first letter of a word is
 *   always treated as lowercase, since that is usually just capitalisation).
 */

const DICTIONARY: Record<string, string> = {
  ma: "म", malai: "मलाई", mero: "मेरो", hami: "हामी", hamro: "हाम्रो",
  timi: "तिमी", timro: "तिम्रो", tapai: "तपाईं", tapain: "तपाईं", tapaai: "तपाईं",
  tapaiko: "तपाईंको", tapailai: "तपाईंलाई", hajur: "हजुर", u: "ऊ", uni: "उनी",
  yo: "यो", tyo: "त्यो", yaha: "यहाँ", yahaa: "यहाँ", tyaha: "त्यहाँ", tyahaa: "त्यहाँ",
  ho: "हो", hoina: "होइन", hoin: "होइन", cha: "छ", chha: "छ", xa: "छ",
  chhu: "छु", chu: "छु", xu: "छु", chau: "छौ", xau: "छौ", chhau: "छौ",
  chan: "छन्", xan: "छन्", chhan: "छन्", chaina: "छैन", xaina: "छैन", chhaina: "छैन",
  thiyo: "थियो", huncha: "हुन्छ", hunchha: "हुन्छ", hunxa: "हुन्छ",
  namaste: "नमस्ते", namaskar: "नमस्कार", dhanyabad: "धन्यवाद", dhanyawad: "धन्यवाद",
  kasto: "कस्तो", kasari: "कसरी", ke: "के", ko: "को", kaha: "कहाँ", kahaa: "कहाँ",
  kina: "किन", kati: "कति", kun: "कुन", kahile: "कहिले",
  ramro: "राम्रो", naramro: "नराम्रो", sanchai: "सन्चै", sancho: "सन्चो", thik: "ठीक",
  ani: "अनि", ra: "र", ta: "त", ki: "कि", na: "न", ni: "नि", pani: "पनि", tara: "तर", aba: "अब", ahile: "अहिले",
  aaja: "आज", aja: "आज", bholi: "भोलि", hijo: "हिजो", dherai: "धेरै", ali: "अलि",
  naam: "नाम", nam: "नाम", ghar: "घर", ama: "आमा", aama: "आमा", buwa: "बुवा", baba: "बाबा",
  dai: "दाइ", didi: "दिदी", bhai: "भाइ", bahini: "बहिनी", sathi: "साथी",
  khana: "खाना", khaana: "खाना", chiya: "चिया", bhat: "भात",
  nepal: "नेपाल", nepali: "नेपाली", kathmandu: "काठमाडौं", pokhara: "पोखरा",
  jau: "जाऊ", jaau: "जाऊ", aau: "आऊ", basa: "बस", gara: "गर", garnu: "गर्नु",
  garchu: "गर्छु", garchhu: "गर्छु", garxu: "गर्छु", garcha: "गर्छ", garxa: "गर्छ",
  maya: "माया", maaya: "माया", prem: "प्रेम", khusi: "खुसी", khushi: "खुसी",
  subha: "शुभ", shubha: "शुभ", bihani: "बिहानी", raati: "राति", rati: "राति",
  din: "दिन", samay: "समय", kaam: "काम", kam: "काम", paisa: "पैसा",
  lai: "लाई", le: "ले", bata: "बाट", sanga: "सँग", sang: "सँग",
};

// Order matters: longer keys must be tried first (handled by sorting below).
const CONSONANTS: Record<string, string> = {
  ksh: "क्ष", gy: "ज्ञ", chh: "छ", kh: "ख", gh: "घ", ch: "च", jh: "झ",
  Th: "ठ", Dh: "ढ", th: "थ", dh: "ध", ph: "फ", bh: "भ", sh: "श", Sh: "ष",
  k: "क", g: "ग", c: "च", x: "छ", j: "ज", z: "ज",
  T: "ट", D: "ड", N: "ण", t: "त", d: "द", n: "न",
  p: "प", f: "फ", b: "ब", m: "म", y: "य", r: "र", l: "ल", w: "व", v: "व",
  s: "स", h: "ह", q: "क",
};

// [independent vowel, matra (vowel sign after a consonant)]
const VOWELS: Record<string, [string, string]> = {
  aa: ["आ", "ा"], A: ["आ", "ा"],
  ai: ["ऐ", "ै"], au: ["औ", "ौ"], ou: ["औ", "ौ"],
  ee: ["ई", "ी"], ii: ["ई", "ी"], I: ["ई", "ी"],
  oo: ["ऊ", "ू"], uu: ["ऊ", "ू"], U: ["ऊ", "ू"],
  a: ["अ", ""], i: ["इ", "ि"], u: ["उ", "ु"], e: ["ए", "े"], o: ["ओ", "ो"],
  E: ["ए", "े"], O: ["ओ", "ो"],
};

const HALANT = "्";
const DIGITS = "०१२३४५६७८९";

const byLengthDesc = (o: object) => Object.keys(o).sort((a, b) => b.length - a.length);
const CONSONANT_KEYS = byLengthDesc(CONSONANTS);
const VOWEL_KEYS = byLengthDesc(VOWELS);

function match(word: string, pos: number, keys: string[]): string | null {
  for (const key of keys) if (word.startsWith(key, pos)) return key;
  return null;
}

function transliterateWord(raw: string): string {
  const lower = raw.toLowerCase();
  if (DICTIONARY[lower]) return DICTIONARY[lower];

  // A leading capital is just sentence/name capitalisation, and ALL-CAPS is shouting;
  // only uppercase letters inside a word signal retroflex (e.g. "kaThmaDaun").
  const word = raw === raw.toUpperCase() ? lower : raw[0].toLowerCase() + raw.slice(1);
  let out = "";
  let i = 0;
  let pendingConsonant = false; // last output was a consonant without a vowel yet

  while (i < word.length) {
    const ch = word[i];

    // Explicit nasal marks: "~" → ँ (chandrabindu), "M" → ं (anusvara)
    if (ch === "~" || ch === "M") {
      out += ch === "~" ? "ँ" : "ं";
      pendingConsonant = false;
      i++;
      continue;
    }

    const c = match(word, i, CONSONANT_KEYS);
    if (c) {
      if (pendingConsonant) out += HALANT; // consonant cluster → conjunct
      out += CONSONANTS[c];
      pendingConsonant = true;
      i += c.length;
      continue;
    }

    const v = match(word, i, VOWEL_KEYS);
    if (v) {
      let [independent, matra] = VOWELS[v];
      const isLast = i + v.length === word.length;
      // Nepali words very commonly end in long ī (तिमी, पानी, नेपाली)
      if (isLast && v === "i" && pendingConsonant && word.length > 2) {
        independent = "ई";
        matra = "ी";
      }
      // A typed word-final "a" is usually long (जना, कुरा, खाना); infinitives like
      // "garna"/"basna" (consonant cluster + na) keep the short inherent vowel.
      if (isLast && v === "a" && pendingConsonant && word.length > 2 && !/[^aeiou]na$/i.test(word)) {
        matra = "ा";
      }
      out += pendingConsonant ? matra : independent;
      pendingConsonant = false;
      i += v.length;
      continue;
    }

    // Unknown character: copy it through
    out += ch;
    pendingConsonant = false;
    i++;
  }
  return out;
}

/** Converts romanized Nepali to Devanagari; Devanagari and {braced} text pass through. */
export function toDevanagari(input: string): string {
  let done = ""; // output so far, used to tell whether "ma" starts a sentence
  for (const part of input.split(/(\{[^}]*\})/)) {
    if (part.startsWith("{") && part.endsWith("}")) {
      done += part.slice(1, -1);
      continue;
    }
    done += part
      .replace(/[A-Za-z~]+/g, (w, offset: number, whole: string) => {
        // "ma" = म (I) at the start of a sentence, otherwise usually मा (in/at)
        if (w.toLowerCase() === "ma") {
          const before = (done + whole.slice(0, offset)).trimEnd();
          return before === "" || /[.!?।]$/.test(before) ? "म" : "मा";
        }
        return transliterateWord(w);
      })
      .replace(/[0-9]/g, (d) => DIGITS[Number(d)])
      .replace(/\.(?=\s|$)/g, "।");
  }
  return done;
}

export function hasLatin(text: string): boolean {
  return /[A-Za-z]/.test(text.replace(/\{[^}]*\}/g, ""));
}
