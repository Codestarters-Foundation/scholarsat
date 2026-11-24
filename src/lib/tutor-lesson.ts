/**
 * The tutor's "lesson": a short list of steps, each with a spoken line, drawings to put on the question
 * ("marks") and, for math, lines of working for a whiteboard. The model returns it as JSON; everything in
 * here is plain TypeScript with no React or DOM, so it is unit tested.
 *
 * The model is never trusted: every field is checked, trimmed and capped, and two rules are enforced in
 * code (not just asked for in the prompt): only the correct choice can get a check mark, and the correct
 * choice can never be struck out.
 */
import type { ChatMessage } from "./ai";
import type { Question } from "./types";

export const MARK_KINDS = ["highlight", "underline", "circle", "strike", "check"] as const;
export type MarkKind = (typeof MARK_KINDS)[number];
export const MARK_TARGETS = ["passage", "stem", "choices"] as const;
export type MarkTarget = (typeof MARK_TARGETS)[number];

export type Mark = {
  kind: MarkKind;
  on: MarkTarget;
  /** Words copied from the question text. Optional only when a whole choice is being marked. */
  quote?: string;
  choice?: "A" | "B" | "C" | "D";
  /** Short label, shown as a number on the drawing and spelled out in the caption. */
  note?: string;
};
export type Step = { say: string; marks: Mark[]; board: string[] };

/** What the sanitiser needs to know about the question being taught. */
export type LessonCtx = { answer: string; choices: number };

export const LIMITS = { steps: 7, marks: 4, board: 6, say: 480, plainSay: 1200, quote: 160, note: 60, boardLine: 70 };

const LETTERS = ["A", "B", "C", "D"] as const;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Model text → one clean line: no markdown, no LaTeX wrappers, no stray whitespace. */
function plain(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/\\[()[\]]/g, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\$/g, "")
    .replace(/[​-‍﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cap(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:]+$/, "") + "…";
}

/** A quote as the model wrote it → the words to look for on screen. Quotes around it, LaTeX wrappers and edge dots go. */
export function cleanQuote(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  let s = v.replace(/\\[()[\]]/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, "").replace(/^(\.{3}|…)\s*|\s*(\.{3}|…)$/g, "").trim();
  if (!s) return undefined;
  return s.length > LIMITS.quote ? s.slice(0, LIMITS.quote).trim() : s;
}

export function sanitizeMark(raw: unknown, ctx: LessonCtx): Mark | null {
  if (!isObj(raw)) return null;
  const kind = (MARK_KINDS as readonly string[]).includes(raw.kind as string) ? (raw.kind as MarkKind) : null;
  if (!kind) return null;

  let choice: Mark["choice"];
  if (typeof raw.choice === "string") {
    const i = LETTERS.indexOf(raw.choice.trim().toUpperCase().slice(0, 1) as (typeof LETTERS)[number]);
    if (i >= 0 && i < ctx.choices) choice = LETTERS[i];
  }
  const quote = cleanQuote(raw.quote);
  let on: MarkTarget = (MARK_TARGETS as readonly string[]).includes(raw.on as string) ? (raw.on as MarkTarget) : "passage";
  if (choice) on = "choices";
  if (on === "choices" && !choice) return null; // "choices" with no letter points at nothing
  if (!choice && !quote) return null;

  // The two safety rules. Applies whenever we know the right letter.
  if (choice && /^[A-D]$/.test(ctx.answer)) {
    if (kind === "check" && choice !== ctx.answer) return null;
    if (kind === "strike" && choice === ctx.answer) return null;
  }

  const note = cap(plain(raw.note), LIMITS.note);
  const m: Mark = { kind, on };
  if (quote) m.quote = quote;
  if (choice) m.choice = choice;
  if (note) m.note = note;
  return m;
}

export function sanitizeStep(raw: unknown, ctx: LessonCtx): Step | null {
  if (!isObj(raw)) return null;
  const say = cap(plain(raw.say).replace(/^step\s*\d+\s*[:.)-]\s*/i, ""), LIMITS.say);
  if (!say) return null;
  const marks = (Array.isArray(raw.marks) ? raw.marks : [])
    .slice(0, LIMITS.marks)
    .map((m) => sanitizeMark(m, ctx))
    .filter((m): m is Mark => !!m);
  const board = (Array.isArray(raw.board) ? raw.board : [])
    .map((l) => cap(plain(l), LIMITS.boardLine))
    .filter(Boolean)
    .slice(0, LIMITS.board);
  return { say, marks, board };
}

// ------------------------------------------------------------------ parsing

function stripFence(t: string): string {
  return t.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
}

/** Whole-reply JSON, tolerating a code fence or a sentence before/after it. */
export function extractJson(text: string): unknown {
  const t = stripFence(text.trim());
  try {
    return JSON.parse(t);
  } catch {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) {
    try {
      return JSON.parse(t.slice(a, b + 1));
    } catch {}
  }
  return null;
}

/**
 * Pulls every *finished* step object out of `{"steps":[ {...}, {...` even while the reply is still
 * streaming or was cut off. Scans strings and escapes properly so braces inside text don't confuse it.
 */
export function extractSteps(text: string): unknown[] {
  const m = /"steps"\s*:\s*\[/.exec(text);
  if (!m) return [];
  const out: unknown[] = [];
  let i = m.index + m[0].length;
  const n = text.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(text[i])) i++;
    if (text[i] !== "{") break; // "]" (done) or still arriving
    const start = i;
    let depth = 0, inStr = false, esc = false, end = -1;
    for (; i < n; i++) {
      const c = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        end = i;
        break;
      }
    }
    if (end < 0) break; // this step hasn't finished arriving
    try {
      out.push(JSON.parse(text.slice(start, end + 1)));
    } catch {
      /* a malformed step is skipped, the rest still count */
    }
    i = end + 1;
  }
  return out;
}

export type Parsed = {
  steps: Step[];
  /** the reply was one valid JSON document */
  complete: boolean;
  /** the model ignored the format and wrote prose; shown as a single text step */
  plain: boolean;
};

/**
 * Text so far → the steps that are ready. Call it on every chunk while streaming (`final` false) and once
 * at the end (`final` true). Only the final call may fall back to treating prose as a one-step lesson.
 */
export function parseLesson(text: string, ctx: LessonCtx, final = true): Parsed {
  const whole = extractJson(text);
  const rawSteps = isObj(whole) && Array.isArray(whole.steps) ? whole.steps : null;
  if (rawSteps) {
    const steps = rawSteps.map((s) => sanitizeStep(s, ctx)).filter((s): s is Step => !!s).slice(0, LIMITS.steps);
    return { steps, complete: true, plain: false };
  }
  const partial = extractSteps(text).map((s) => sanitizeStep(s, ctx)).filter((s): s is Step => !!s).slice(0, LIMITS.steps);
  if (partial.length) return { steps: partial, complete: false, plain: false };
  if (final) {
    const t = stripFence(text.trim());
    if (t && !/[{[]/.test(t.slice(0, 40))) {
      const say = cap(plain(t), LIMITS.plainSay);
      if (say) return { steps: [{ say, marks: [], board: [] }], complete: false, plain: true };
    }
  }
  return { steps: [], complete: false, plain: false };
}

// ------------------------------------------------------------------- prompts

export const TUTOR_DRAW_SYSTEM = [
  "You are a patient, encouraging SAT tutor in a free prep app. You teach by drawing on the student's screen, a little at a time.",
  "Reply with ONE JSON object and nothing else: no markdown fences, no text before or after.",
  "",
  'Format: {"steps":[{"say":"...","marks":[{"kind":"highlight","on":"passage","quote":"exact words","note":"short label"}],"board":["3x + 5 = 20"]}]}',
  "",
  "Rules:",
  "- 3 to 5 steps (up to 6 for math). Each step teaches one idea. \"say\" is 1 to 3 short sentences of plain text, spoken to the student (\"you\"). No markdown, no LaTeX.",
  "- \"marks\" are drawings on the question, 0 to 3 per step. kind is one of: highlight (evidence or given information), underline (a key word or phrase), circle (what the question asks about, or a trap), strike (a wrong choice or a wrong phrase), check (the correct choice or the evidence that confirms it).",
  "- \"on\" is \"passage\" (the passage or table), \"stem\" (the question sentence) or \"choices\". For choices also set \"choice\" to A, B, C or D. With a \"quote\" it marks that phrase inside the choice; without one it marks the whole choice.",
  "- \"quote\" must be copied EXACTLY, character for character, from the text you were given: 2 to 12 words, specific enough to appear once. Never quote LaTeX or anything with a backslash; to point at math in the question, quote plain words or numbers such as \"20\" or \"x + 5\".",
  "- \"note\" (optional, at most 8 words) labels a mark. On screen the marks of a step are numbered in order, and the notes are listed under your sentence.",
  "- \"board\" (math only, optional) is 1 to 4 lines of working you write on a whiteboard in this step, in plain text: \"3x + 5 = 20\", \"3x = 15\", \"x = 5\". Use ^ for powers, sqrt(...) for roots, / for fractions. No LaTeX, no dollar signs.",
  "- The official answer and explanation are authoritative: never contradict them. Only check the correct choice, and only strike wrong ones.",
  "- If the student picked a wrong answer, name the trap that probably pulled them there, kindly, without making them feel bad.",
  "- Reading and Writing questions: no board. Mark the evidence first, then deal with the choices.",
  "- The last step gives one tip they can reuse on similar questions.",
].join("\n");

export type TutorQuestion = Pick<Question, "section" | "skill" | "difficulty" | "type" | "stem" | "passage" | "passage2" | "table" | "choices">;

function tableText(t: NonNullable<Question["table"]>): string {
  return (t.caption ? t.caption + "\n" : "") + [t.headers.join(" | "), ...t.rows.map((r) => r.join(" | "))].join("\n");
}

/** The first message of a tutoring session: the whole question, what the student did, and the official explanation. */
export function lessonRequest(q: TutorQuestion, response: string, answer: string, explanation: string, correct: boolean): string {
  const parts: string[] = [`Section: ${q.section === "math" ? "Math" : "Reading and Writing"}. Skill: ${q.skill}.`];
  if (q.passage) parts.push(`Passage:\n${q.passage}`);
  if (q.passage2) parts.push(`Second passage:\n${q.passage2}`);
  if (q.table) parts.push(`Table:\n${tableText(q.table)}`);
  parts.push(`Question:\n${q.stem}`);
  if (q.choices?.length) parts.push(q.choices.map((c, i) => `${LETTERS[i]}. ${c}`).join("\n"));
  parts.push(`Correct answer: ${answer}`);
  parts.push(`The student answered: ${response || "(nothing)"}${correct ? " (correct)" : " (incorrect)"}`);
  parts.push(`Official explanation:\n${explanation}`);
  parts.push(
    correct
      ? "Teach this question as a short drawn lesson, in a different way than the official explanation: how an expert reads it and why the right answer holds up."
      : "Teach this question as a short drawn lesson: how to read it, why the correct answer is right, and where the student's choice went wrong.",
  );
  return parts.join("\n\n");
}

export function followUpRequest(ask: string): string {
  return `The student asks: "${ask.replace(/"/g, "'").trim()}"\n\nAnswer in the same JSON format, 1 to 4 steps, only about what they asked. Draw on the question again where it helps.`;
}

/** Quick questions offered under the lesson. Wrong picks get "why not mine". */
export function quickAsks(q: Pick<TutorQuestion, "type" | "section">, response: string, correct: boolean): string[] {
  const out = ["Explain it more simply", q.section === "math" ? "Show me a different way" : "How would I spot this faster?"];
  if (q.type === "mcq") {
    if (!correct && /^[A-D]$/.test(response)) out.unshift(`Why is ${response} wrong?`);
    else out.unshift("Why are the other choices wrong?");
  }
  return out;
}

/** Keeps the first message (the question) and the most recent exchange, so long chats stay cheap. */
export function trimHistory(msgs: ChatMessage[], keep = 4): ChatMessage[] {
  if (msgs.length <= keep + 1) return msgs;
  return [msgs[0], ...msgs.slice(msgs.length - keep)];
}
