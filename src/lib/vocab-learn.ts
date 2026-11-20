/**
 * Logic for the vocabulary "Learn" mode: session building, question generation, answer checking.
 *
 * The idea: flashcards are passive recognition. Learning sticks when you have to *retrieve* a word,
 * see it in a *sentence* (which is how the SAT tests vocabulary), and see it again at growing
 * intervals. Each word climbs through three question types as its Leitner box rises:
 *   box 0   def2word  pick the word that matches a definition
 *   box 1-2 cloze     pick the word that completes an example sentence (SAT style)
 *   box 3+  type      recall the word from its definition and type it
 * A miss puts the word back in the session a few cards later until it is answered correctly once.
 *
 * Everything here is pure (no DOM, no network, injectable randomness) so it can be unit tested.
 */
import type { Vocab } from "../data/vocab";
import { MASTERED_BOX, type SrsState } from "./srs";

// ---------------------------------------------------------------- randomness

export type Rng = () => number;

/** Small seeded PRNG (same family the app already uses for its seeded shuffle). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rnd: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const keyOf = (w: Vocab) => w.word.toLowerCase();

// --------------------------------------------------------- word forms in text

/** The ending a word wears in its example sentence. */
export type Infl = "base" | "s" | "ed" | "ing" | "ly";

/** Verbs whose past tense the example sentences use irregularly. */
const IRREGULAR_PAST: Record<string, string[]> = {
  bear: ["bore", "borne"],
  cast: ["cast"],
  cling: ["clung"],
  draw: ["drew", "drawn"],
  hold: ["held"],
  lend: ["lent"],
  shed: ["shed"],
  strike: ["struck"],
  undercut: ["undercut"],
  undertake: ["undertook"],
  uphold: ["upheld"],
  withstand: ["withstood"],
};

/**
 * Common irregular verbs. Their "-ed" form can't be built by rule ("drawed"), so they are never
 * used as the wrong options in a past-tense fill-in-the-blank. Entries of 4+ letters also catch
 * prefixed forms (uphold, withstand, mislead); a false hit only costs us one candidate.
 */
const IRREGULAR_VERBS = new Set(
  ("be bear beat become begin bend bet bid bind bite bleed blow break breed bring build burst buy cast catch choose cling come " +
    "cost creep cut deal dig do draw drink drive eat fall feed feel fight find flee fling fly forbid forget forgive forsake freeze " +
    "get give go grind grow hang have hear hide hit hold hurt keep kneel know lay lead leap leave lend let lie light lose make mean " +
    "meet overcome overtake pay put quit read ride ring rise run say see seek sell send set shake shed shine shoot show shrink shut " +
    "sing sink sit sleep slide speak speed spend spin split spread spring stand steal stick sting stink strike strive swear sweep " +
    "swim swing take teach tear tell think throw thrust understand undertake upset wake wear weave weep win withdraw withhold " +
    "withstand wring write").split(" "),
);
const irregularMemo = new Map<string, boolean>();
function isIrregularVerb(lemma: string): boolean {
  const w = lemma.toLowerCase();
  let r = irregularMemo.get(w);
  if (r === undefined) {
    r = IRREGULAR_VERBS.has(w);
    if (!r) for (const b of IRREGULAR_VERBS) if (b.length >= 4 && w.length > b.length && w.endsWith(b)) { r = true; break; }
    irregularMemo.set(w, r);
  }
  return r;
}

/** Regular English endings. Returns the lowercase form of `lemma` wearing `kind`. */
export function inflect(lemma: string, kind: Infl): string {
  const w = lemma.toLowerCase();
  switch (kind) {
    case "base":
      return w;
    case "s":
      if (/(s|x|z|ch|sh)$/.test(w)) return w + "es";
      if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
      return w + "s";
    case "ed":
      if (/e$/.test(w)) return w + "d";
      if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ied";
      return w + "ed";
    case "ing":
      if (/ie$/.test(w)) return w.slice(0, -2) + "ying";
      if (/[^eoy]e$/.test(w)) return w.slice(0, -1) + "ing";
      return w + "ing";
    case "ly":
      if (/[^aeiou]le$/.test(w)) return w.slice(0, -1) + "y";
      if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ily";
      if (/ic$/.test(w)) return w + "ally";
      return w + "ly";
  }
}

const KINDS: Infl[] = ["base", "s", "ed", "ing", "ly"];

function formsOf(lemma: string): [Infl, string][] {
  const w = lemma.toLowerCase();
  const out: [Infl, string][] = KINDS.map((k) => [k, inflect(w, k)]);
  for (const f of IRREGULAR_PAST[w] ?? []) out.push(["ed", f]);
  return out;
}

function inflKind(lemma: string, token: string): Infl | null {
  const t = token.toLowerCase();
  for (const [k, f] of formsOf(lemma)) if (f === t) return k;
  return null;
}

const isLetter = (c: string | undefined) => !!c && /[A-Za-z]/.test(c);

export type Match = { start: number; end: number; surface: string; kind: Infl };

/** Finds every place `lemma` appears in `text`, in any ending we know how to produce. */
export function locateWord(lemma: string, text: string): Match[] {
  const lw = lemma.toLowerCase();
  const out: Match[] = [];
  if (/\s/.test(lw)) {
    // Multi-word entry: match the exact phrase on word boundaries.
    const low = text.toLowerCase();
    let from = 0;
    for (;;) {
      const i = low.indexOf(lw, from);
      if (i < 0) break;
      const j = i + lw.length;
      if (!isLetter(low[i - 1]) && !isLetter(low[j])) out.push({ start: i, end: j, surface: text.slice(i, j), kind: "base" });
      from = j;
    }
    return out;
  }
  for (const m of text.matchAll(/[A-Za-z][A-Za-z'’-]*/g)) {
    const core = m[0].replace(/['’]s$/i, ""); // "the king's throne" -> "king"
    const kind = inflKind(lw, core);
    if (kind) out.push({ start: m.index ?? 0, end: (m.index ?? 0) + core.length, surface: core, kind });
  }
  return out;
}

/** Splits an example sentence into plain and highlighted (the word itself) runs. */
export function splitExample(ex: string, lemma: string): { text: string; hit: boolean }[] {
  const ms = locateWord(lemma, ex);
  if (!ms.length) return [{ text: ex, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  let pos = 0;
  for (const m of ms) {
    if (m.start > pos) parts.push({ text: ex.slice(pos, m.start), hit: false });
    parts.push({ text: ex.slice(m.start, m.end), hit: true });
    pos = m.end;
  }
  if (pos < ex.length) parts.push({ text: ex.slice(pos), hit: false });
  return parts;
}

// ------------------------------------------------------------------ questions

export type QuestionKind = "def2word" | "cloze" | "type";

export type LearnQuestion = {
  kind: QuestionKind;
  target: Vocab;
  /** The definition (def2word, type) or the example sentence with a blank (cloze). */
  prompt: string;
  /** Multiple-choice options; empty for typed questions. */
  choices: string[];
  /** Index of the right choice; -1 for typed questions. */
  answer: number;
  /** Typed questions only: part of speech, first letter, length. */
  hint?: string;
};

const posKey = (p: string) => p.toLowerCase().replace(/\.$/, "");
const POS_LABEL: Record<string, string> = { adj: "adjective", adv: "adverb", noun: "noun", verb: "verb" };

/** Can we safely build the `kind` form of this lemma with the simple rules above? */
function safeFor(kind: Infl, lemma: string): boolean {
  if (/\s/.test(lemma)) return kind === "base";
  // Words like "refer" -> "referred" double a consonant; our rules would misspell them.
  if ((kind === "ed" || kind === "ing") && /[^aeiou][aeiou][bdgklmnprt]$/.test(lemma.toLowerCase())) return false;
  // "drawed" is not a word.
  if (kind === "ed" && isIrregularVerb(lemma)) return false;
  return true;
}

/**
 * Picks plausible wrong answers: same part of speech and same kind of word first (so a hard
 * adjective is not hiding among everyday nouns). `relax` lets def2word widen the pool when a
 * tier runs dry; cloze never relaxes, because a wrong part of speech would not fit the sentence.
 */
function pickDistractors(target: Vocab, pool: readonly Vocab[], kind: Infl | null, rnd: Rng, relax: boolean, n = 3): Vocab[] {
  const t = keyOf(target);
  const eligible = pool.filter((w) => keyOf(w) !== t && (kind === null || safeFor(kind, w.word)));
  const sameKind = (w: Vocab) => posKey(w.pos) === posKey(target.pos) && w.kind === target.kind;
  const samePos = (w: Vocab) => posKey(w.pos) === posKey(target.pos);
  const tiers = relax ? [sameKind, samePos, () => true] : [sameKind, samePos];
  const chosen: Vocab[] = [];
  for (const tier of tiers) {
    for (const w of shuffle(eligible.filter(tier), rnd)) {
      if (chosen.length >= n) break;
      if (!chosen.includes(w)) chosen.push(w);
    }
    if (chosen.length >= n) break;
  }
  return chosen.length >= n ? chosen : [];
}

function makeCloze(target: Vocab, pool: readonly Vocab[], rnd: Rng): LearnQuestion | null {
  const ms = locateWord(target.word, target.ex);
  if (!ms.length) return null;
  const kind = ms[0].kind;
  if (ms.some((m) => m.kind !== kind)) return null;
  const distractors = pickDistractors(target, pool, kind, rnd, false);
  if (!distractors.length) return null;
  const capital = /[A-Z]/.test(ms[0].surface[0]);
  const fix = (s: string) => (capital ? s[0].toUpperCase() + s.slice(1) : s);
  const surface = fix(ms[0].surface.toLowerCase());
  const forms = distractors.map((d) => fix(inflect(d.word, kind)));
  if (new Set([surface, ...forms]).size !== 4) return null;
  let sentence = target.ex;
  for (const m of [...ms].reverse()) sentence = sentence.slice(0, m.start) + "_____" + sentence.slice(m.end);
  const choices = shuffle([surface, ...forms], rnd);
  return { kind: "cloze", target, prompt: sentence, choices, answer: choices.indexOf(surface) };
}

/** Builds a question of the requested kind. A cloze falls back to def2word if the sentence can't be blanked cleanly. */
export function makeQuestion(target: Vocab, kind: QuestionKind, pool: readonly Vocab[], rnd: Rng): LearnQuestion {
  if (kind === "cloze") {
    const c = makeCloze(target, pool, rnd);
    if (c) return c;
    kind = "def2word";
  }
  if (kind === "def2word") {
    const d = pickDistractors(target, pool, null, rnd, true);
    if (d.length) {
      const choices = shuffle([target.word, ...d.map((x) => x.word)], rnd);
      return { kind: "def2word", target, prompt: target.def, choices, answer: choices.indexOf(target.word) };
    }
  }
  const letters = target.word.replace(/[^a-z]/gi, "").length;
  const pos = POS_LABEL[posKey(target.pos)] ?? target.pos;
  return {
    kind: "type",
    target,
    prompt: target.def,
    choices: [],
    answer: -1,
    hint: `${pos} · starts with “${target.word[0]}” · ${letters} letters`,
  };
}

// ----------------------------------------------------------- checking typing

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export type TypedResult = "correct" | "close" | "wrong";

/**
 * Typed recall. Any ending of the word is accepted. One slip in a long word counts ("close"),
 * unless what was typed is a different real word from the list (prescribe vs proscribe).
 */
export function checkTyped(input: string, target: Vocab, allWords?: ReadonlySet<string>): TypedResult {
  const got = input.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z -]/g, "");
  if (!got) return "wrong";
  const word = keyOf(target);
  const accepted = new Set<string>([word, ...formsOf(word).map(([, f]) => f)]);
  for (const m of locateWord(word, target.ex)) accepted.add(m.surface.toLowerCase());
  if (accepted.has(got)) return "correct";
  if (word.length >= 6 && !allWords?.has(got) && editDistance(got, word) <= 1) return "close";
  return "wrong";
}

// ---------------------------------------------------------- building sessions

export type SessionItem = { word: Vocab; isNew: boolean; box: number };

export const SESSION_REVIEWS = 10;
export const SESSION_NEW = 5;
/** The first words in the list are the app's "Top 50 Essentials"; they are introduced in order. */
const ESSENTIALS = 50;

function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Which words to study now: words that are due (oldest first), plus a few new ones.
 * New words come from the essentials first, then in a fixed pseudo-random order so a student is
 * not stuck learning the whole alphabet starting with "a". If a big backlog is waiting, no new
 * words are added until it is cleared. `ahead` is for a student who is caught up and wants more:
 * it pulls the soonest-due words instead.
 */
export function buildSession(
  words: readonly Vocab[],
  srs: Readonly<Record<string, SrsState>>,
  known: ReadonlySet<string>,
  now: number,
  rnd: Rng,
  opts: { ahead?: boolean } = {},
): SessionItem[] {
  const seen = words.filter((w) => srs[keyOf(w)]);
  const byDue = (a: Vocab, b: Vocab) => srs[keyOf(a)].due - srs[keyOf(b)].due;
  const dueAll = seen.filter((w) => srs[keyOf(w)].due <= now).sort(byDue);
  let reviews = dueAll.slice(0, SESSION_REVIEWS);
  if (opts.ahead && !dueAll.length) reviews = [...seen].sort(byDue).slice(0, SESSION_REVIEWS);

  let fresh: Vocab[] = [];
  if (!opts.ahead && dueAll.length <= SESSION_REVIEWS * 2) {
    const candidates = words.map((w, i) => ({ w, i })).filter(({ w }) => !srs[keyOf(w)] && !known.has(keyOf(w)));
    candidates.sort((a, b) => {
      const ea = a.i < ESSENTIALS ? 0 : 1;
      const eb = b.i < ESSENTIALS ? 0 : 1;
      return ea - eb || (ea === 0 ? a.i - b.i : stableHash(keyOf(a.w)) - stableHash(keyOf(b.w)));
    });
    fresh = candidates.slice(0, SESSION_NEW).map(({ w }) => w);
  }
  return [
    ...shuffle(reviews, rnd).map((w) => ({ word: w, isNew: false, box: srs[keyOf(w)].box })),
    ...fresh.map((w) => ({ word: w, isNew: true, box: 0 })),
  ];
}

export type SrsSummary = { due: number; fresh: number; learning: number; mastered: number; nextDue: number | null };

export function summarize(words: readonly Vocab[], srs: Readonly<Record<string, SrsState>>, known: ReadonlySet<string>, now: number): SrsSummary {
  let due = 0, fresh = 0, learning = 0, mastered = 0;
  let nextDue: number | null = null;
  for (const w of words) {
    const s = srs[keyOf(w)];
    if (!s) {
      if (!known.has(keyOf(w))) fresh++;
      continue;
    }
    if (s.box >= MASTERED_BOX) mastered++;
    else learning++;
    if (s.due <= now) due++;
    else if (nextDue === null || s.due < nextDue) nextDue = s.due;
  }
  return { due, fresh, learning, mastered, nextDue };
}

// ------------------------------------------------------- the session machine

export type Step = { item: SessionItem; /** Set when this is a second try after a miss. */ retryOf?: QuestionKind };

export type SessionState = {
  queue: Step[];
  total: number;
  /** Words answered correctly at least once this session. */
  done: number;
  /** First-attempt result per word; only first attempts are reported to spaced repetition. */
  firstTry: Record<string, boolean>;
};

/** A missed word returns this many cards later. */
export const RETRY_GAP = 3;

export const startSession = (items: SessionItem[]): SessionState => ({
  queue: items.map((item) => ({ item })),
  total: items.length,
  done: 0,
  firstTry: {},
});

/** Which question type the front card should ask. */
export function chooseKind(step: Step): QuestionKind {
  if (step.retryOf) return step.retryOf === "def2word" ? "cloze" : "def2word";
  if (step.item.box <= 0) return "def2word";
  if (step.item.box <= 2) return "cloze";
  return "type";
}

/**
 * Records the answer to the front card. Returns the next state, and, only for a word's first
 * attempt, a report to send to spaced repetition (so a miss followed by a lucky retry still
 * counts as a miss).
 */
export function answerStep(
  s: SessionState,
  asked: QuestionKind,
  correct: boolean,
): { state: SessionState; report: { word: string; correct: boolean } | null } {
  const [front, ...rest] = s.queue;
  if (!front) return { state: s, report: null };
  const key = keyOf(front.item.word);
  const first = !(key in s.firstTry);
  const firstTry = first ? { ...s.firstTry, [key]: correct } : s.firstTry;
  const report = first ? { word: key, correct } : null;
  if (correct) return { state: { ...s, queue: rest, done: s.done + 1, firstTry }, report };
  const queue = [...rest];
  queue.splice(Math.min(queue.length, RETRY_GAP), 0, { item: front.item, retryOf: asked });
  return { state: { ...s, queue, firstTry }, report };
}

// ---------------------------------------------------------------- formatting

export function formatDue(ms: number, now: number): string {
  const d = ms - now;
  if (d <= 60_000) return "now";
  const mins = Math.round(d / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(d / 3_600_000);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(d / 86_400_000);
  return days <= 1 ? "tomorrow" : `in ${days} days`;
}
