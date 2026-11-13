import "server-only";
import raw from "@/data/questions.json";
import type { Difficulty, Question, Section } from "./types";

export const QUESTIONS = raw as Question[];
export const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export type PublicQuestion = Omit<Question, "answer" | "explanation">;
export function toPublic(q: Question): PublicQuestion {
  const { answer: _a, explanation: _e, ...rest } = q;
  void _a;
  void _e;
  return rest;
}

export type Filters = { section?: Section; domain?: string; skill?: string; difficulty?: Difficulty[] };

export function filterQuestions(f: Filters) {
  return QUESTIONS.filter(
    (q) =>
      (!f.section || q.section === f.section) &&
      (!f.domain || q.domain === f.domain) &&
      (!f.skill || q.skill === f.skill) &&
      (!f.difficulty?.length || f.difficulty.includes(q.difficulty)),
  );
}

function parseNum(s: string): number | null {
  const t = s.trim().replace(/\s+/g, "").replace(/^\+/, "");
  if (!t) return null;
  if (/^-?\d*\.?\d+\/-?\d*\.?\d+$/.test(t)) {
    const [p, q] = t.split("/").map(Number);
    return q === 0 ? null : p / q;
  }
  if (/^-?\d*\.?\d+$/.test(t)) return Number(t);
  return null;
}

/** SAT-style grading: type-in answers accept any equivalent fraction or decimal (decimals may be rounded/truncated to fill the grid). */
export function isCorrect(q: Question, response: string): boolean {
  if (q.type === "mcq") return response.trim().toUpperCase() === q.answer;
  const want = parseNum(q.answer);
  const got = parseNum(response);
  if (want === null || got === null) return false;
  if (Math.abs(want - got) < 1e-9) return true;
  // accept decimals that match to the precision the student entered, with at least 3 sig. chars (as on the SAT grid)
  const dec = response.trim().split(".")[1];
  if (dec && dec.length >= 3) {
    const scale = 10 ** dec.length;
    return Math.abs(Math.trunc(want * scale) - got * scale) < 1e-6 || Math.abs(Math.round(want * scale) - got * scale) < 1e-6;
  }
  return false;
}

export function counts() {
  const total = QUESTIONS.length;
  const bySection = { math: 0, rw: 0 } as Record<Section, number>;
  const bySkill: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  for (const q of QUESTIONS) {
    bySection[q.section]++;
    bySkill[q.skill] = (bySkill[q.skill] ?? 0) + 1;
    byDomain[q.domain] = (byDomain[q.domain] ?? 0) + 1;
  }
  return { total, bySection, bySkill, byDomain };
}

/** Deterministic daily question so everyone sees the same one each day. */
export function dailyQuestion(section: Section, date = new Date()): Question {
  const pool = QUESTIONS.filter((q) => q.section === section && q.difficulty !== "E");
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  return pool[(day * 2654435761) % pool.length];
}
