import "server-only";
import { db } from "./db";
import { dailyQuestion, utcDay } from "./bank";
import type { Section } from "./types";

export type DailyReveal = {
  /** the correct choice letter */
  answer: string;
  explanation: string;
  /** whether the viewer's (first, locked-in) pick was right */
  correct: boolean;
  /** the viewer's pick */
  mine: string;
};

/**
 * The answer and explanation for today's daily question, but ONLY for a viewer who has already
 * voted on it. Anyone who hasn't voted gets null, so the poll stays honest.
 */
export function getDailyReveal(section: Section, userId: number): DailyReveal | null {
  const row = db
    .prepare("SELECT choice FROM daily_votes WHERE day = ? AND section = ? AND user_id = ?")
    .get(utcDay(), section, userId) as { choice: string } | undefined;
  if (!row) return null;
  const q = dailyQuestion(section);
  return { answer: q.answer, explanation: q.explanation, correct: row.choice === q.answer, mine: row.choice };
}
