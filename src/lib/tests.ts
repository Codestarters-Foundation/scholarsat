import "server-only";
import { db } from "./db";
import { QUESTIONS, BY_ID, isCorrect } from "./bank";
import type { Difficulty, Question, Section } from "./types";

/** Digital-SAT-style structure: 2 modules per section; module 2 adapts to module 1 performance. */
export const MODULES: { section: Section; n: number; minutes: number }[] = [
  { section: "rw", n: 27, minutes: 32 },
  { section: "rw", n: 27, minutes: 32 },
  { section: "math", n: 22, minutes: 35 },
  { section: "math", n: 22, minutes: 35 },
];

export type TestState = {
  modules: { ids: string[]; startedAt: number | null; submittedAt: number | null; path?: "easier" | "harder" }[];
  answers: Record<string, string>;
  flags: string[];
  current: number;
};

const W: Record<Difficulty, number> = { E: 1, M: 1.4, H: 1.8 };

function pickBalanced(section: Section, n: number, mix: Record<Difficulty, number>, exclude: Set<string>, rnd: () => number): string[] {
  const pool = QUESTIONS.filter((q) => q.section === section && !exclude.has(q.id));
  // spread across domains in proportion, then fill by difficulty mix
  const byDomain = new Map<string, Question[]>();
  for (const q of pool) (byDomain.get(q.domain) ?? byDomain.set(q.domain, []).get(q.domain)!).push(q);
  const domains = [...byDomain.keys()];
  const picked: string[] = [];
  const diffs: Difficulty[] = [];
  (Object.keys(mix) as Difficulty[]).forEach((d) => {
    for (let i = 0; i < Math.round(mix[d] * n); i++) diffs.push(d);
  });
  while (diffs.length < n) diffs.push("M");
  let k = 0;
  for (const d of diffs.slice(0, n)) {
    for (let tries = 0; tries < domains.length * 2; tries++) {
      const dom = domains[(k + tries) % domains.length];
      const cands = byDomain.get(dom)!.filter((q) => q.difficulty === d && !picked.includes(q.id));
      if (cands.length) {
        picked.push(cands[Math.floor(rnd() * cands.length)].id);
        break;
      }
    }
    k++;
  }
  // fallback fill
  const rest = pool.filter((q) => !picked.includes(q.id));
  while (picked.length < n && rest.length) picked.push(rest.splice(Math.floor(rnd() * rest.length), 1)[0].id);
  // order: domain grouping like the real test, easier first within domain
  const order = (id: string) => {
    const q = BY_ID.get(id)!;
    return domains.indexOf(q.domain) * 10 + W[q.difficulty];
  };
  return picked.sort((a, b) => order(a) - order(b));
}

export function createTest(userId: number) {
  const seen = new Set((db.prepare("SELECT DISTINCT question_id FROM attempts WHERE user_id = ? AND source = 'test'").all(userId) as { question_id: string }[]).map((r) => r.question_id));
  const rnd = Math.random;
  const m1rw = pickBalanced("rw", 27, { E: 0.33, M: 0.34, H: 0.33 }, seen, rnd);
  const m1m = pickBalanced("math", 22, { E: 0.33, M: 0.34, H: 0.33 }, seen, rnd);
  const state: TestState = {
    modules: [
      { ids: m1rw, startedAt: null, submittedAt: null },
      { ids: [], startedAt: null, submittedAt: null },
      { ids: m1m, startedAt: null, submittedAt: null },
      { ids: [], startedAt: null, submittedAt: null },
    ],
    answers: {},
    flags: [],
    current: 0,
  };
  const info = db.prepare("INSERT INTO tests (user_id, state, started_at) VALUES (?, ?, ?)").run(userId, JSON.stringify(state), Date.now());
  return Number(info.lastInsertRowid);
}

export function getTest(userId: number, id: number) {
  const row = db.prepare("SELECT * FROM tests WHERE id = ? AND user_id = ?").get(id, userId) as
    | { id: number; state: string; started_at: number; finished_at: number | null; score_rw: number | null; score_math: number | null }
    | undefined;
  if (!row) return null;
  return { ...row, state: JSON.parse(row.state) as TestState };
}

export function saveState(id: number, state: TestState) {
  db.prepare("UPDATE tests SET state = ? WHERE id = ?").run(JSON.stringify(state), id);
}

function moduleScore(ids: string[], answers: Record<string, string>) {
  let got = 0, max = 0;
  for (const id of ids) {
    const q = BY_ID.get(id)!;
    max += W[q.difficulty];
    if (answers[id] !== undefined && isCorrect(q, answers[id])) got += W[q.difficulty];
  }
  return max ? got / max : 0;
}

/** Submit the current module; builds the adaptive next module when needed. Returns updated state. */
export function submitModule(userId: number, id: number): TestState | null {
  const t = getTest(userId, id);
  if (!t || t.finished_at) return null;
  const s = t.state;
  const cur = s.modules[s.current];
  cur.submittedAt = Date.now();
  if (s.current === 0 || s.current === 2) {
    const section: Section = s.current === 0 ? "rw" : "math";
    const perf = moduleScore(cur.ids, s.answers);
    const harder = perf >= 0.6;
    const used = new Set(s.modules.flatMap((m) => m.ids));
    const n = MODULES[s.current + 1].n;
    s.modules[s.current + 1].ids = pickBalanced(section, n, harder ? { E: 0.15, M: 0.4, H: 0.45 } : { E: 0.5, M: 0.4, H: 0.1 }, used, Math.random);
    s.modules[s.current + 1].path = harder ? "harder" : "easier";
  }
  if (s.current < 3) {
    s.current++;
    saveState(id, s);
    return s;
  }
  // finish: score + record attempts
  const scoreSection = (a: number, b: number) => {
    const m1 = moduleScore(s.modules[a].ids, s.answers);
    const m2 = moduleScore(s.modules[b].ids, s.answers);
    const ceiling = s.modules[b].path === "harder" ? 800 : 620;
    const raw = 0.45 * m1 + 0.55 * m2;
    return Math.max(200, Math.min(800, Math.round((200 + (ceiling - 200) * raw) / 10) * 10));
  };
  const rw = scoreSection(0, 1), math = scoreSection(2, 3);
  const now = Date.now();
  const ins = db.prepare("INSERT INTO attempts (user_id, question_id, response, correct, source, created_at) VALUES (?, ?, ?, ?, 'test', ?)");
  const tx = db.transaction(() => {
    for (const m of s.modules)
      for (const qid of m.ids) {
        const resp = s.answers[qid] ?? "";
        ins.run(userId, qid, resp, resp && isCorrect(BY_ID.get(qid)!, resp) ? 1 : 0, now);
      }
    db.prepare("UPDATE tests SET state = ?, finished_at = ?, score_rw = ?, score_math = ? WHERE id = ?").run(JSON.stringify(s), now, rw, math, id);
  });
  tx();
  return s;
}
