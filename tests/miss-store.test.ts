import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSchedule, reasonCounts, saveMissReason, type Db } from "../src/lib/miss-store";
import { DAY } from "../src/lib/missed-loop";

/** A throwaway in-memory database: better-sqlite3 (what the app uses) when installed, else Node's built-in SQLite. */
async function open(): Promise<Db> {
  // Module names go through variables so TypeScript does not need type definitions for either one.
  const better = "better-sqlite3", builtin = "node:sqlite";
  let db: Db;
  try {
    const mod = await import(better);
    db = new mod.default(":memory:") as Db;
  } catch {
    const { DatabaseSync } = await import(builtin);
    db = new DatabaseSync(":memory:") as Db;
  }
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT);
    CREATE TABLE attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL, response TEXT NOT NULL, correct INTEGER NOT NULL, time_ms INTEGER, source TEXT NOT NULL DEFAULT 'practice', created_at INTEGER NOT NULL);
    INSERT INTO users (email) VALUES ('a@x'), ('b@x');
  `);
  return db;
}
const NOW = Date.UTC(2026, 10, 10, 12, 0, 0);
const attempt = (db: Db, user: number, q: string, ok: boolean, t: number) =>
  db.prepare("INSERT INTO attempts (user_id, question_id, response, correct, created_at) VALUES (?, ?, 'A', ?, ?)").run(user, q, ok ? 1 : 0, t);

test("a reason attaches to the latest wrong answer, can be changed, and can be cleared", async () => {
  const db = await open();
  attempt(db, 1, "q1", false, NOW - 60_000);
  assert.equal(saveMissReason(db, 1, "q1", "misread", NOW), "saved");
  assert.equal(saveMissReason(db, 1, "q1", "rushed", NOW), "saved");
  assert.deepEqual(reasonCounts(db, 1, NOW), { counts: { misread: 0, careless: 0, rushed: 1, dont_know: 0 }, untagged: 0, total: 1 });
  assert.equal(saveMissReason(db, 1, "q1", null, NOW), "cleared");
  assert.deepEqual(reasonCounts(db, 1, NOW).untagged, 1);
});

test("no wrong answer, a stale one, or someone else's answer: nothing is saved", async () => {
  const db = await open();
  attempt(db, 1, "q1", true, NOW - 1000);
  assert.equal(saveMissReason(db, 1, "q1", "misread", NOW), "no-attempt");
  attempt(db, 1, "q2", false, NOW - 3 * 3_600_000);
  assert.equal(saveMissReason(db, 1, "q2", "misread", NOW), "no-attempt");
  attempt(db, 2, "q3", false, NOW - 1000);
  assert.equal(saveMissReason(db, 1, "q3", "misread", NOW), "no-attempt");
  assert.equal(reasonCounts(db, 1, NOW).counts.misread, 0);
});

test("a reason is tied to one attempt, so a later miss starts without one", async () => {
  const db = await open();
  attempt(db, 1, "q1", false, NOW - 3 * DAY);
  saveMissReason(db, 1, "q1", "careless", NOW - 3 * DAY + 1000);
  attempt(db, 1, "q1", false, NOW - 1000);
  const c = reasonCounts(db, 1, NOW);
  assert.deepEqual([c.counts.careless, c.untagged, c.total], [1, 1, 2]);
});

test("the breakdown covers the last 60 days and one student only", async () => {
  const db = await open();
  attempt(db, 1, "old", false, NOW - 90 * DAY);
  attempt(db, 2, "other", false, NOW - 1000);
  attempt(db, 1, "new", false, NOW - 1000);
  assert.equal(reasonCounts(db, 1, NOW).total, 1);
});

test("deleting an attempt (or a user) removes its reason", async () => {
  const db = await open();
  attempt(db, 1, "q1", false, NOW - 1000);
  saveMissReason(db, 1, "q1", "misread", NOW);
  db.prepare("DELETE FROM users WHERE id = 1").run();
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM miss_reasons").get() as { n: number }).n, 0);
});

test("the schedule comes from the stored attempts and skips questions no longer in the bank", async () => {
  const db = await open();
  attempt(db, 1, "q1", false, NOW - 2 * DAY);
  attempt(db, 1, "gone", false, NOW - 2 * DAY);
  attempt(db, 2, "q9", false, NOW - 2 * DAY);
  const s = loadSchedule(db, 1, NOW, (id) => id !== "gone");
  assert.deepEqual(s.due.map((d) => d.id), ["q1"]);
});
