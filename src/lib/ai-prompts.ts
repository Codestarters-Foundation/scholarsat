/** Prompts for the optional AI helpers. Plain text in, plain text out (the UI does not render markdown or LaTeX). */
import type { Vocab } from "../data/vocab";
import type { Question } from "./types";

const STYLE =
  "Write plain text only: no markdown, no bullet symbols, no LaTeX or dollar signs. Write math in plain text such as x^2 or 3/4. Be warm, direct and concise.";

export const TUTOR_SYSTEM =
  "You are a friendly SAT tutor inside a free prep app. The official answer and explanation come from the app's question bank and are authoritative: never contradict them. " +
  "If the question itself looks flawed, say so in one short sentence. " +
  STYLE;

export const MEMORY_TRICK_SYSTEM =
  "You help students remember SAT vocabulary. Only mention a word root or origin if you are confident it is real; never invent etymology. " + STYLE;

function tableText(t: NonNullable<Question["table"]>): string {
  const rows = [t.headers.join(" | "), ...t.rows.map((r) => r.join(" | "))];
  return (t.caption ? t.caption + "\n" : "") + rows.join("\n");
}

type Explainable = Pick<Question, "section" | "skill" | "difficulty" | "type" | "stem" | "passage" | "passage2" | "table" | "choices">;

/** Everything the tutor needs to explain one answered question. */
export function explainQuestionPrompt(q: Explainable, response: string, answer: string, explanation: string, correct: boolean): string {
  const parts: string[] = [`Section: ${q.section === "math" ? "Math" : "Reading and Writing"}. Skill: ${q.skill}.`];
  if (q.passage) parts.push(`Passage:\n${q.passage}`);
  if (q.passage2) parts.push(`Second passage:\n${q.passage2}`);
  if (q.table) parts.push(`Table:\n${tableText(q.table)}`);
  parts.push(`Question:\n${q.stem}`);
  if (q.choices?.length) parts.push(q.choices.map((c, i) => `${"ABCD"[i]}. ${c}`).join("\n"));
  parts.push(`Correct answer: ${answer}`);
  parts.push(`The student answered: ${response || "(nothing)"}${correct ? " (correct)" : " (incorrect)"}`);
  parts.push(`Official explanation:\n${explanation}`);
  parts.push(
    correct
      ? "In about 100 words, explain the idea behind this question in a different way than the official explanation, then give one tip for spotting this kind of question quickly."
      : "In about 150 words, explain why the correct answer is right, what likely led the student to their choice and how to avoid that trap, then give one quick tip for this skill.",
  );
  return parts.join("\n\n");
}

/** A memory aid for one vocabulary word. */
export function memoryTrickPrompt(v: Pick<Vocab, "word" | "pos" | "def" | "ex">): string {
  return (
    `Word: ${v.word} (${v.pos})\nMeaning: ${v.def}\nExample: ${v.ex}\n\n` +
    "In under 90 words give: (1) one vivid memory trick or word-root hint, (2) a new example sentence in the style of an SAT passage, " +
    "and (3) one word students often confuse it with and how to tell them apart."
  );
}
