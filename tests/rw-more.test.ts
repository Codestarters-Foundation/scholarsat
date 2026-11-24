import { test } from "node:test";
import assert from "node:assert/strict";
import { generateRWMore } from "../scripts/gen-rw-more";

const qs = generateRWMore();

test("the hand-written reading batch is well formed", () => {
  assert.ok(qs.length >= 16);
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length, "unique ids");
  for (const q of qs) {
    assert.equal(q.type, "mcq");
    assert.equal(q.choices?.length, 4, q.id);
    assert.equal(new Set(q.choices!.map((c) => c.trim().toLowerCase())).size, 4, "distinct choices " + q.id);
    assert.ok("ABCD".includes(q.answer), q.id);
    assert.ok(q.explanation.length >= 40, "explained " + q.id);
    assert.ok(q.passage && q.passage.length > 40, q.id);
  }
});

test("skills have the shape the rest of the app expects", () => {
  for (const q of qs) {
    if (q.skill === "Cross-Text Connections") assert.ok(q.passage!.startsWith("Text 1") && q.passage2?.startsWith("Text 2"), q.id);
    if (q.skill === "Rhetorical Synthesis") {
      assert.ok(q.passage!.startsWith("While researching a topic, a student has taken the following notes:"), q.id);
      assert.ok(q.stem.startsWith("The student wants to "), q.id);
    }
  }
  assert.deepEqual([...new Set(qs.map((q) => q.skill))].sort(), ["Cross-Text Connections", "Rhetorical Synthesis", "Text Structure and Purpose"]);
});

test("right answers are spread evenly over A-D (no guessable letter)", () => {
  const count: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) count[q.answer]++;
  const n = Object.values(count);
  assert.ok(Math.max(...n) - Math.min(...n) <= 1, JSON.stringify(count));
});

test("no choice invents a number that the passage does not contain", () => {
  const nums = (s: string) => s.replace(/,/g, "").match(/\d+(\.\d+)?/g) ?? [];
  for (const q of qs) {
    const have = new Set(nums(q.passage! + " " + (q.passage2 ?? "")));
    for (const c of q.choices!) for (const n of nums(c)) assert.ok(have.has(n), `${q.id}: ${n} in "${c.slice(0, 50)}"`);
  }
});

test("the batch is deterministic (so it never reshuffles answers between builds)", () => {
  assert.equal(JSON.stringify(generateRWMore()), JSON.stringify(qs));
});
