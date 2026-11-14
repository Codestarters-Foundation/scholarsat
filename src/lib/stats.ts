import "server-only";
import { db } from "./db";
import { BY_ID } from "./bank";
import type { Section } from "./types";
import { MIN_FOR_PREDICTION, sectionScore } from "./scoring";

type Row = { question_id: string; correct: number; created_at: number };

export function userStats(userId: number) {
  const rows = db.prepare("SELECT question_id, correct, created_at FROM attempts WHERE user_id = ? ORDER BY created_at").all(userId) as Row[];
  const latest = new Map<string, Row>();
  for (const r of rows) latest.set(r.question_id, r);

  const bySkill: Record<string, { section: Section; domain: string; seen: number; correct: number }> = {};
  const bySection: Record<Section, { seen: number; correct: number }> = { math: { seen: 0, correct: 0 }, rw: { seen: 0, correct: 0 } };
  for (const r of latest.values()) {
    const q = BY_ID.get(r.question_id);
    if (!q) continue;
    const s = (bySkill[q.skill] ??= { section: q.section, domain: q.domain, seen: 0, correct: 0 });
    s.seen++;
    s.correct += r.correct;
    bySection[q.section].seen++;
    bySection[q.section].correct += r.correct;
  }

  // streak: consecutive local days (UTC) with at least one attempt, ending today or yesterday
  const days = new Set(rows.map((r) => Math.floor(r.created_at / 86400000)));
  const today = Math.floor(Date.now() / 86400000);
  let streak = 0;
  let d = days.has(today) ? today : today - 1;
  while (days.has(d)) {
    streak++;
    d--;
  }

  // last 14 days activity
  const activity = Array.from({ length: 14 }, (_, i) => {
    const day = today - 13 + i;
    return { day, count: rows.filter((r) => Math.floor(r.created_at / 86400000) === day).length };
  });

  const predicted = (["rw", "math"] as Section[]).map((sec) => {
    const s = bySection[sec];
    if (s.seen < MIN_FOR_PREDICTION) return null;
    return sectionScore(s.correct / s.seen);
  });

  return {
    answered: rows.length,
    unique: latest.size,
    correct: [...latest.values()].filter((r) => r.correct).length,
    bySkill,
    bySection,
    streak,
    activity,
    predicted: predicted[0] !== null && predicted[1] !== null ? { rw: predicted[0]!, math: predicted[1]!, total: predicted[0]! + predicted[1]! } : null,
  };
}

export function statusSets(userId: number) {
  const rows = db
    .prepare(
      `SELECT a.question_id, a.correct FROM attempts a
       JOIN (SELECT question_id, MAX(id) mid FROM attempts WHERE user_id = ? GROUP BY question_id) l ON l.mid = a.id`,
    )
    .all(userId) as { question_id: string; correct: number }[];
  const answered = new Set(rows.map((r) => r.question_id));
  const incorrect = new Set(rows.filter((r) => !r.correct).map((r) => r.question_id));
  const bookmarks = new Set(
    (db.prepare("SELECT question_id FROM bookmarks WHERE user_id = ?").all(userId) as { question_id: string }[]).map((r) => r.question_id),
  );
  return { answered, incorrect, bookmarks };
}
