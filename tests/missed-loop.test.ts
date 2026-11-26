import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSchedule, whenLabel, DAY, EARLY_MS, type Attempt } from "../src/lib/missed-loop";

const T0 = Date.UTC(2026, 10, 1, 15, 0, 0); // a Sunday afternoon
let nextId = 1;
const at = (q: string, ok: boolean, t: number): Attempt => ({ id: nextId++, question_id: q, correct: ok ? 1 : 0, created_at: t });
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

test("a miss comes back after a day, not before", () => {
  const a = [at("q1", false, T0)];
  assert.deepEqual(ids(buildSchedule(a, T0 + 60_000).due), []);
  assert.deepEqual(ids(buildSchedule(a, T0 + 60_000).upcoming), ["q1"]);
  assert.deepEqual(ids(buildSchedule(a, T0 + DAY).due), ["q1"]);
});

test("it counts as due a few hours early, so an evening miss is waiting the next morning", () => {
  const a = [at("q1", false, T0)];
  assert.equal(buildSchedule(a, T0 + DAY - EARLY_MS - 1).due.length, 0);
  assert.equal(buildSchedule(a, T0 + DAY - EARLY_MS).due.length, 1);
});

test("1 day, then 3, then 7: right at each step graduates the question", () => {
  const a = [at("q1", false, T0)];
  let t = T0 + DAY;
  a.push(at("q1", true, t));
  let s = buildSchedule(a, t + 1000);
  assert.equal(s.due.length, 0);
  assert.equal(s.upcoming[0].step, 1);
  assert.equal(s.upcoming[0].dueAt, t + 3 * DAY);
  t += 3 * DAY;
  a.push(at("q1", true, t));
  s = buildSchedule(a, t + 1000);
  assert.equal(s.upcoming[0].step, 2);
  assert.equal(s.upcoming[0].dueAt, t + 7 * DAY);
  t += 7 * DAY;
  a.push(at("q1", true, t));
  s = buildSchedule(a, t + 1000);
  assert.deepEqual([s.due.length, s.upcoming.length, s.learning, s.graduated], [0, 0, 0, 1]);
});

test("a miss at any step starts the ladder over", () => {
  const a = [at("q1", false, T0), at("q1", true, T0 + DAY), at("q1", false, T0 + 4 * DAY)];
  const s = buildSchedule(a, T0 + 4 * DAY + 1000);
  assert.equal(s.upcoming[0].step, 0);
  assert.equal(s.upcoming[0].dueAt, T0 + 5 * DAY);
});

test("a graduated question that is missed again returns to the ladder", () => {
  const a = [at("q1", false, T0), at("q1", true, T0 + DAY), at("q1", true, T0 + 4 * DAY), at("q1", true, T0 + 11 * DAY)];
  assert.equal(buildSchedule(a, T0 + 12 * DAY).graduated, 1);
  a.push(at("q1", false, T0 + 20 * DAY));
  const s = buildSchedule(a, T0 + 20 * DAY + 1000);
  assert.equal(s.graduated, 0);
  assert.equal(s.learning, 1);
});

test("a correct answer ahead of schedule is practice, not a step up", () => {
  const a = [at("q1", false, T0), at("q1", true, T0 + 2 * 3_600_000)];
  const s = buildSchedule(a, T0 + 3 * 3_600_000);
  assert.equal(s.upcoming[0].step, 0);
  assert.equal(s.upcoming[0].dueAt, T0 + DAY);
});

test("answering later than due still moves up one step, and the next gap counts from the answer", () => {
  const a = [at("q1", false, T0), at("q1", true, T0 + 5 * DAY)];
  const s = buildSchedule(a, T0 + 5 * DAY + 1000);
  assert.equal(s.upcoming[0].step, 1);
  assert.equal(s.upcoming[0].dueAt, T0 + 8 * DAY);
});

test("a correct answer to a question that was never missed does nothing", () => {
  const s = buildSchedule([at("q1", true, T0), at("q1", true, T0 + DAY)], T0 + 2 * DAY);
  assert.deepEqual([s.learning, s.graduated], [0, 0]);
});

test("many questions: most overdue first, upcoming soonest first, input order does not matter", () => {
  const a = [at("b", false, T0 + 2 * DAY), at("a", false, T0), at("c", false, T0 + 5 * DAY), at("d", false, T0 + 3 * DAY)];
  const now = T0 + 4 * DAY;
  const s = buildSchedule(a, now);
  assert.deepEqual(ids(s.due), ["a", "b", "d"]);
  assert.deepEqual(ids(s.upcoming), ["c"]);
  assert.deepEqual(ids(buildSchedule([...a].reverse(), now).due), ids(s.due));
  assert.ok(s.due[0].overdueMs > s.due[1].overdueMs);
});

test("attempts logged in the same millisecond are ordered by id", () => {
  const a: Attempt[] = [{ id: 2, question_id: "q", correct: 1, created_at: T0 }, { id: 1, question_id: "q", correct: 0, created_at: T0 }];
  assert.equal(buildSchedule(a, T0 + 1).learning, 1); // miss first, then the right answer is too early to count
});

test("booleans work as well as 0/1, and an empty history is empty", () => {
  assert.equal(buildSchedule([{ question_id: "q", correct: false, created_at: T0 }], T0).learning, 1);
  assert.deepEqual(buildSchedule([], T0), { due: [], upcoming: [], learning: 0, graduated: 0 });
});

test("whenLabel", () => {
  assert.equal(whenLabel(T0, T0), "due now");
  assert.equal(whenLabel(T0 + DAY, T0), "tomorrow");
  assert.equal(whenLabel(T0 + 3 * DAY, T0), "in 3 days");
});
