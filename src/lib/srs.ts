/**
 * Spaced-repetition scheduling for vocabulary (a Leitner-box system).
 *
 * Pure and dependency-free so the exact same code runs in the browser (optimistic UI, signed-out
 * progress in localStorage) and in /api/vocab/review (the source of truth for signed-in users).
 */
export type SrsState = {
  /** 0 = missed or brand new, 5 = best. */
  box: number;
  /** ms epoch when the word is next due. */
  due: number;
  /** Total correct reviews. */
  reps: number;
  /** Times the word was missed after it was first learned. */
  lapses: number;
};

const DAY = 86_400_000;
export const MAX_BOX = 5;
/** A word at this box or higher counts as mastered. */
export const MASTERED_BOX = 4;
/** Days until the next review after landing in each box (index = box). */
export const BOX_DAYS = [0, 1, 3, 7, 16, 35] as const;
/** After a miss the word is due again almost immediately. */
export const RETRY_MS = 10 * 60_000;

/** Applies one graded review and returns the next state. `prev` is undefined for a word never seen. */
export function reviewCard(prev: SrsState | undefined, correct: boolean, now: number): SrsState {
  const p: SrsState = prev ?? { box: 0, due: now, reps: 0, lapses: 0 };
  if (correct) {
    const box = Math.min(MAX_BOX, p.box + 1);
    return { box, due: now + BOX_DAYS[box] * DAY, reps: p.reps + 1, lapses: p.lapses };
  }
  // A brand-new word that is missed stays in box 0. A word that was already learned drops two boxes.
  const box = p.box === 0 ? 0 : Math.max(1, p.box - 2);
  return { box, due: now + RETRY_MS, reps: p.reps, lapses: p.box === 0 ? p.lapses : p.lapses + 1 };
}

export const isMastered = (box: number) => box >= MASTERED_BOX;

/**
 * Keeps the older "I know this" flag (used by the dashboard counts and the flashcard decks)
 * in step with spaced repetition: mastered words are known, shaky words are not, and the
 * middle boxes leave the flag as the student last set it.
 */
export function knownAfter(wasKnown: boolean, box: number): boolean {
  if (box >= MASTERED_BOX) return true;
  if (box <= 2) return false;
  return wasKnown;
}
