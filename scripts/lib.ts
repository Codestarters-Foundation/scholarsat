import type { Difficulty, Question, Section, Table } from "../src/lib/types";

/** Deterministic PRNG so the bank is reproducible from a seed. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)];
  const nz = (lo: number, hi: number) => {
    let v = 0;
    while (v === 0) v = int(lo, hi);
    return v;
  };
  const shuffle = <T,>(arr: T[]): T[] => {
    const a2 = arr.slice();
    for (let i = a2.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a2[i], a2[j]] = [a2[j], a2[i]];
    }
    return a2;
  };
  return { next, int, pick, nz, shuffle };
}
export type R = ReturnType<typeof rng>;

export const LETTERS = ["A", "B", "C", "D"] as const;

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** Format a rational p/q as LaTeX, reduced. */
export function frac(p: number, q: number): string {
  if (q < 0) {
    p = -p;
    q = -q;
  }
  const g = gcd(p, q);
  p /= g;
  q /= g;
  if (q === 1) return String(p);
  const sign = p < 0 ? "-" : "";
  return `${sign}\\frac{${Math.abs(p)}}{${q}}`;
}

/** Plain-text answer for a rational (for type-in answers). */
export function fracPlain(p: number, q: number): string {
  if (q < 0) {
    p = -p;
    q = -q;
  }
  const g = gcd(p, q);
  p /= g;
  q /= g;
  return q === 1 ? String(p) : `${p}/${q}`;
}

/** Signed term helper: coef(3,"x") -> "3x", coef(-1,"x") -> "-x", coef(1,"") -> "1" */
export function term(c: number, v: string, first = false): string {
  if (c === 0) return "";
  const abs = Math.abs(c);
  const body = v && abs === 1 ? v : `${abs}${v}`;
  if (first) return (c < 0 ? "-" : "") + body;
  return c < 0 ? ` - ${body}` : ` + ${body}`;
}

/** Build a polynomial-like expression from [coef, var] pairs, skipping zeros. */
export function expr(parts: [number, string][]): string {
  let out = "";
  for (const [c, v] of parts) {
    if (c === 0) continue;
    out += term(c, v, out === "");
  }
  return out || "0";
}

export const m = (s: string) => `\\(${s}\\)`;

export function fmtNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return String(Math.round(n * 1000) / 1000);
}

/**
 * Build a multiple-choice question from a correct answer and distractors.
 * Distractors that duplicate the answer (or each other) are dropped; returns null if fewer than 3 remain.
 */
export function mcq(
  r: R,
  base: Omit<Question, "type" | "choices" | "answer" | "id">,
  correct: string,
  distractors: string[],
): Question | null {
  const uniq: string[] = [];
  for (const d of distractors) if (d !== correct && !uniq.includes(d)) uniq.push(d);
  if (uniq.length < 3) return null;
  const choices = r.shuffle([correct, ...uniq.slice(0, 3)]);
  return { ...base, id: "", type: "mcq", choices, answer: LETTERS[choices.indexOf(correct)] };
}

export function spr(base: Omit<Question, "type" | "choices" | "answer" | "id">, answer: string): Question {
  return { ...base, id: "", type: "spr", answer };
}

export type Gen = (r: R, d: Difficulty) => Question | null;

export function hashId(prefix: string, s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return prefix + (h >>> 0).toString(16).padStart(8, "0");
}

export function collect(
  section: Section,
  gens: Record<string, { domain: string; byDiff: Partial<Record<Difficulty, Gen[]>> }>,
  perCell: number,
  seed: number,
): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  const r = rng(seed);
  for (const [skill, { domain, byDiff }] of Object.entries(gens)) {
    for (const d of ["E", "M", "H"] as Difficulty[]) {
      const list = byDiff[d];
      if (!list?.length) continue;
      let made = 0;
      let tries = 0;
      while (made < perCell && tries < perCell * 40) {
        tries++;
        const g = list[tries % list.length];
        const q = g(r, d);
        if (!q) continue;
        const key = (q.passage ?? "") + "|" + q.stem + "|" + (q.choices ?? []).slice().sort().join("|") + JSON.stringify(q.table ?? "");
        if (seen.has(key)) continue;
        seen.add(key);
        q.section = section;
        q.domain = domain;
        q.skill = skill;
        q.difficulty = d;
        q.id = hashId(section === "math" ? "m" : "r", key);
        out.push(q);
        made++;
      }
    }
  }
  return out;
}

export type { Question, Table, Difficulty };
