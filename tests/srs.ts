import assert from "node:assert/strict";
import test from "node:test";
import { BOX_DAYS, RETRY_MS, knownAfter, reviewCard, type SrsState } from "../src/lib/srs";

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

test("a first correct answer moves a new word to box 1, due tomorrow", () => {
  const s = reviewCard(undefined, true, NOW);
  assert.deepEqual(s, { box: 1, due: NOW + DAY, reps: 1, lapses: 0 });
});

test("correct answers climb the boxes with growing gaps and stop at the top", () => {
  let s: SrsState | undefined;
  const gaps: number[] = [];
  for (let i = 0; i < 8; i++) {
    s = reviewCard(s, true, NOW);
    gaps.push((s.due - NOW) / DAY);
  }
  assert.deepEqual(gaps, [1, 3, 7, 16, 35, 35, 35, 35]);
  assert.equal(s!.box, 5);
  assert.equal(s!.reps, 8);
  assert.equal(BOX_DAYS.length, 6);
});

test("missing a brand-new word keeps it in box 0 without counting a lapse", () => {
  const s = reviewCard(undefined, false, NOW);
  assert.deepEqual(s, { box: 0, due: NOW + RETRY_MS, reps: 0, lapses: 0 });
});

test("missing a learned word drops two boxes (never below 1), counts a lapse, and is due soon", () => {
  assert.equal(reviewCard({ box: 5, due: 0, reps: 9, lapses: 0 }, false, NOW).box, 3);
  assert.equal(reviewCard({ box: 2, due: 0, reps: 3, lapses: 0 }, false, NOW).box, 1);
  assert.equal(reviewCard({ box: 1, due: 0, reps: 1, lapses: 0 }, false, NOW).box, 1);
  const s = reviewCard({ box: 4, due: 0, reps: 6, lapses: 1 }, false, NOW);
  assert.deepEqual(s, { box: 2, due: NOW + RETRY_MS, reps: 6, lapses: 2 });
});

test("reviewCard does not mutate its input", () => {
  const prev: SrsState = { box: 2, due: 5, reps: 2, lapses: 0 };
  reviewCard(prev, true, NOW);
  reviewCard(prev, false, NOW);
  assert.deepEqual(prev, { box: 2, due: 5, reps: 2, lapses: 0 });
});

test("knownAfter keeps the legacy 'known' flag in step with the boxes", () => {
  assert.equal(knownAfter(false, 4), true);
  assert.equal(knownAfter(false, 5), true);
  assert.equal(knownAfter(true, 2), false);
  assert.equal(knownAfter(true, 0), false);
  assert.equal(knownAfter(true, 3), true);
  assert.equal(knownAfter(false, 3), false);
});
