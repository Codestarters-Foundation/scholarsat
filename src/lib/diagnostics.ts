import "server-only";
import { db } from "./db";
import { BY_ID } from "./bank";
import { userStats } from "./stats";
import type { Section } from "./types";

/** One answered question, compact enough to send every one to the browser for charting. */
export type AttemptRec = { t: number; c: 0 | 1; s: 0 | 1; k: string }; // s: 0 = math, 1 = reading & writing
export type HistoryRow = {
  id: string;
  t: number;
  correct: boolean;
  source: "practice" | "test";
  section: Section;
  domain: string;
  skill: string;
  difficulty: "E" | "M" | "H";
  preview: string;
  bookmarked: boolean;
  timeMs: number | null;
};
export type SkillStat = { skill: string; section: Section; seen: number; acc: number };

export const HISTORY_LIMIT = 500;
const REC_LIMIT = 10000;

/** Strips LaTeX markup so a question stem reads as a one-line preview. */
function preview(stem: string) {
  return stem.replace(/\\\(|\\\)|\\\[|\\\]/g, "").replace(/\\(?:text|mathrm)\{([^}]*)\}/g, "$1").replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

export function getDiagnostics(userId: number) {
  const s = userStats(userId);

  const recsDesc = db.prepare("SELECT question_id k, correct c, created_at t FROM attempts WHERE user_id = ? ORDER BY id DESC LIMIT ?").all(userId, REC_LIMIT) as { k: string; c: number; t: number }[];
  const recs: AttemptRec[] = [];
  for (let i = recsDesc.length - 1; i >= 0; i--) {
    const r = recsDesc[i], q = BY_ID.get(r.k);
    if (q) recs.push({ t: r.t, c: r.c ? 1 : 0, s: q.section === "math" ? 0 : 1, k: r.k });
  }

  const total = (db.prepare("SELECT COUNT(*) n FROM attempts WHERE user_id = ?").get(userId) as { n: number }).n;
  const bookmarks = new Set((db.prepare("SELECT question_id FROM bookmarks WHERE user_id = ?").all(userId) as { question_id: string }[]).map((r) => r.question_id));

  const rows = db.prepare("SELECT question_id k, correct c, created_at t, source, time_ms ms FROM attempts WHERE user_id = ? ORDER BY id DESC LIMIT ?").all(userId, HISTORY_LIMIT) as { k: string; c: number; t: number; source: string; ms: number | null }[];
  const history: HistoryRow[] = [];
  for (const r of rows) {
    const q = BY_ID.get(r.k);
    if (!q) continue;
    history.push({ id: q.id, t: r.t, correct: !!r.c, source: r.source === "test" ? "test" : "practice", section: q.section, domain: q.domain, skill: q.skill, difficulty: q.difficulty, preview: preview(q.stem), bookmarked: bookmarks.has(q.id), timeMs: r.ms });
  }

  const tests = (db.prepare("SELECT finished_at t, score_rw a, score_math b FROM tests WHERE user_id = ? AND finished_at IS NOT NULL ORDER BY finished_at").all(userId) as { t: number; a: number | null; b: number | null }[]).map((r) => ({ t: r.t, total: (r.a ?? 0) + (r.b ?? 0) }));

  // Strongest and weakest skills, judged on the latest answer to each question; needs a few answers to mean anything.
  const ranked: SkillStat[] = Object.entries(s.bySkill)
    .filter(([, v]) => v.seen >= 3)
    .map(([skill, v]) => ({ skill, section: v.section, seen: v.seen, acc: v.correct / v.seen }));
  const strongest = [...ranked].sort((a, b) => b.acc - a.acc || b.seen - a.seen).slice(0, 3);
  const taken = new Set(strongest.map((x) => x.skill));
  const weakest = [...ranked].filter((x) => !taken.has(x.skill)).sort((a, b) => a.acc - b.acc || b.seen - a.seen).slice(0, 3);

  const math = (db.prepare("SELECT COUNT(*) n FROM attempts a WHERE a.user_id = ? AND a.question_id LIKE 'm%'").get(userId) as { n: number }).n;
  return {
    predicted: s.predicted,
    seen: { math: s.bySection.math.seen, rw: s.bySection.rw.seen },
    total,
    split: { math, rw: total - math },
    strongest,
    weakest,
    recs,
    history,
    tests,
    historyTruncated: total > history.length,
  };
}
export type Diagnostics = ReturnType<typeof getDiagnostics>;
