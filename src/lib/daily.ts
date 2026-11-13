import "server-only";
import { db } from "./db";
import { dailyQuestion, toPublic, utcDay, type PublicQuestion } from "./bank";
import type { Section } from "./types";

export type DailyPollData = {
  day: number;
  section: Section;
  question: PublicQuestion;
  /** votes per choice letter */
  counts: Record<string, number>;
  total: number;
  /** the viewer's pick today, if they've voted */
  mine: string | null;
  /** ms epoch when the next question goes live */
  resetsAt: number;
};

export function getDailyPoll(section: Section, userId: number): DailyPollData {
  const day = utcDay();
  const q = dailyQuestion(section);
  const rows = db.prepare("SELECT choice, COUNT(*) n FROM daily_votes WHERE day = ? AND section = ? GROUP BY choice").all(day, section) as { choice: string; n: number }[];
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of rows) counts[r.choice] = r.n;
  const mine = (db.prepare("SELECT choice FROM daily_votes WHERE day = ? AND section = ? AND user_id = ?").get(day, section, userId) as { choice: string } | undefined)?.choice ?? null;
  return {
    day,
    section,
    question: toPublic(q),
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    mine,
    resetsAt: (day + 1) * 86400000,
  };
}

/** One vote per person per question per day; later attempts keep the first pick. */
export function castVote(section: Section, userId: number, choice: string) {
  db.prepare("INSERT OR IGNORE INTO daily_votes (day, section, user_id, choice, created_at) VALUES (?, ?, ?, ?, ?)").run(utcDay(), section, userId, choice, Date.now());
  return getDailyPoll(section, userId);
}
