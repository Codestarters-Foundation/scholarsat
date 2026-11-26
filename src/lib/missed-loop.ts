/**
 * The missed-question loop. A question you miss comes back after 1 day, then 3, then 7. Get it right when it
 * is due and it moves up a step; get it right three times in a row and it graduates. Any miss starts it over.
 *
 * Pure functions over the attempts you already store, so there is nothing extra to keep in sync. No imports, so it
 * can be unit tested directly.
 */
export type Attempt = { id?: number; question_id: string; correct: number | boolean; created_at: number };

export const DAY = 86_400_000;
export const LADDER_DAYS = [1, 3, 7] as const;
/** A question counts as due a little early, so one missed late in the evening is waiting the next morning. */
export const EARLY_MS = 6 * 3_600_000;

export type DueItem = { id: string; step: number; dueAt: number; overdueMs: number };
export type Schedule = {
  /** due now, most overdue first */
  due: DueItem[];
  /** not due yet, soonest first */
  upcoming: DueItem[];
  /** questions still on the ladder (due + upcoming) */
  learning: number;
  /** questions answered correctly at all three steps */
  graduated: number;
};

type State = { step: number; dueAt: number } | "done";

export function buildSchedule(attempts: readonly Attempt[], now: number): Schedule {
  const ordered = attempts
    .map((a, i) => ({ a, i }))
    .sort((x, y) => x.a.created_at - y.a.created_at || (x.a.id ?? 0) - (y.a.id ?? 0) || x.i - y.i)
    .map((x) => x.a);

  const states = new Map<string, State>();
  for (const a of ordered) {
    const t = a.created_at;
    const ok = a.correct === true || a.correct === 1;
    const s = states.get(a.question_id);
    if (!ok) {
      states.set(a.question_id, { step: 0, dueAt: t + LADDER_DAYS[0] * DAY }); // any miss starts the ladder over
      continue;
    }
    if (!s || s === "done") continue; // a correct answer to a question that was never missed
    if (t < s.dueAt - EARLY_MS) continue; // right, but ahead of schedule: good practice, no step up
    const step = s.step + 1;
    if (step >= LADDER_DAYS.length) states.set(a.question_id, "done");
    else states.set(a.question_id, { step, dueAt: t + LADDER_DAYS[step] * DAY });
  }

  const due: DueItem[] = [];
  const upcoming: DueItem[] = [];
  let graduated = 0;
  for (const [id, s] of states) {
    if (s === "done") { graduated++; continue; }
    const item = { id, step: s.step, dueAt: s.dueAt, overdueMs: Math.max(0, now - s.dueAt) };
    (s.dueAt - EARLY_MS <= now ? due : upcoming).push(item);
  }
  due.sort((x, y) => x.dueAt - y.dueAt || x.id.localeCompare(y.id));
  upcoming.sort((x, y) => x.dueAt - y.dueAt || x.id.localeCompare(y.id));
  return { due, upcoming, learning: due.length + upcoming.length, graduated };
}

/** "today", "tomorrow", "in 3 days": how far away a due time is, for display. */
export function whenLabel(dueAt: number, now: number): string {
  if (dueAt - EARLY_MS <= now) return "due now";
  const days = Math.ceil((dueAt - EARLY_MS - now) / DAY);
  return days <= 1 ? "tomorrow" : `in ${days} days`;
}
