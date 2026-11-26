/**
 * Database side of the missed-question loop: the reason a student gave for a miss, the schedule and the breakdown.
 * Takes the database as an argument so it can be tested with a throwaway one. The table is created on first use, so
 * db.ts does not change.
 */
import { buildSchedule, type Schedule } from "./missed-loop";
import { MISS_REASONS, isMissReason, type MissReasonId } from "./miss-reasons";

type Stmt = { run(...a: unknown[]): unknown; get(...a: unknown[]): unknown; all(...a: unknown[]): unknown[] };
export type Db = { exec(sql: string): unknown; prepare(sql: string): Stmt };

const ready = new WeakSet<object>();
export function ensureMissTable(db: Db) {
  if (ready.has(db)) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS miss_reasons (
      attempt_id INTEGER PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS miss_reasons_user ON miss_reasons(user_id);
  `);
  ready.add(db);
}

/** The reason can be given for a miss from the last two hours, so it is always about the answer on screen. */
const FRESH_MS = 2 * 3_600_000;

export type SaveResult = "saved" | "cleared" | "no-attempt";

/** Attaches a reason to the student's latest wrong answer to this question. `null` removes it. */
export function saveMissReason(db: Db, userId: number, questionId: string, reason: MissReasonId | null, now = Date.now()): SaveResult {
  ensureMissTable(db);
  const row = db
    .prepare("SELECT id, created_at FROM attempts WHERE user_id = ? AND question_id = ? AND correct = 0 ORDER BY id DESC LIMIT 1")
    .get(userId, questionId) as { id: number; created_at: number } | undefined;
  if (!row || now - row.created_at > FRESH_MS) return "no-attempt";
  if (reason === null) {
    db.prepare("DELETE FROM miss_reasons WHERE attempt_id = ? AND user_id = ?").run(row.id, userId);
    return "cleared";
  }
  db.prepare(
    "INSERT INTO miss_reasons (attempt_id, user_id, question_id, reason, created_at) VALUES (?, ?, ?, ?, ?) " +
      "ON CONFLICT(attempt_id) DO UPDATE SET reason = excluded.reason, created_at = excluded.created_at",
  ).run(row.id, userId, questionId, reason, now);
  return "saved";
}

/** Everything the student has answered, run through the ladder. `known` drops questions that are no longer in the bank. */
export function loadSchedule(db: Db, userId: number, now = Date.now(), known: (id: string) => boolean = () => true): Schedule {
  const rows = db
    .prepare("SELECT id, question_id, correct, created_at FROM attempts WHERE user_id = ? ORDER BY created_at, id")
    .all(userId) as { id: number; question_id: string; correct: number; created_at: number }[];
  return buildSchedule(rows.filter((r) => known(r.question_id)), now);
}

export type ReasonCounts = { counts: Record<MissReasonId, number>; untagged: number; total: number };
const WINDOW_MS = 60 * 86_400_000;

/** Misses in the last 60 days, split by the reason the student gave. */
export function reasonCounts(db: Db, userId: number, now = Date.now()): ReasonCounts {
  ensureMissTable(db);
  const since = now - WINDOW_MS;
  const counts = Object.fromEntries(MISS_REASONS.map((r) => [r.id, 0])) as Record<MissReasonId, number>;
  const rows = db
    .prepare(
      "SELECT m.reason AS reason, COUNT(*) AS n FROM attempts a JOIN miss_reasons m ON m.attempt_id = a.id " +
        "WHERE a.user_id = ? AND a.correct = 0 AND a.created_at >= ? GROUP BY m.reason",
    )
    .all(userId, since) as { reason: string; n: number }[];
  for (const r of rows) if (isMissReason(r.reason)) counts[r.reason] = r.n;
  const all = db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE user_id = ? AND correct = 0 AND created_at >= ?").get(userId, since) as { n: number };
  const tagged = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, untagged: Math.max(0, all.n - tagged), total: all.n };
}
