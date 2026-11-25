/** 30 Reading and Writing + 30 math questions from rw-more2.ts and math-more2.ts. Uses its own seeded RNGs, so adding or
 *  editing items here never changes the answer order of any other question in the bank. */
import { LETTERS, hashId, rng } from "./lib";
import type { Question } from "../src/lib/types";
import { RW_MORE2 } from "./rw-more2";
import { MATH_MORE2 } from "./math-more2";

/** Right answers go in a shuffled, evenly spread list of slots, so no letter is guessable. Wrong choices fill the rest in random order. */
function place<T extends { right: string; wrong: string[] }>(items: T[], seed: number): string[][] {
  const r = rng(seed);
  const slots = r.shuffle(Array.from({ length: items.length }, (_, i) => i % 4));
  return items.map((it, i) => {
    const others = r.shuffle(it.wrong.slice(0, 3));
    return [...others.slice(0, slots[i]), it.right, ...others.slice(slots[i])];
  });
}

export function generateRWMore2(seed = 9191): Question[] {
  const choices = place(RW_MORE2, seed);
  return RW_MORE2.map((it, i) => ({
    id: hashId("r", it.passage + "|" + it.stem + "|" + it.right),
    section: "rw", domain: it.domain, skill: it.skill, difficulty: it.d, type: "mcq",
    passage: it.passage, stem: it.stem, choices: choices[i],
    answer: LETTERS[choices[i].indexOf(it.right)], explanation: it.why,
  }));
}

export function generateMathMore2(seed = 9292): Question[] {
  const mcqs = MATH_MORE2.filter((m) => m.right);
  const placed = place(mcqs.map((m) => ({ right: m.right!, wrong: m.wrong! })), seed);
  let k = 0;
  return MATH_MORE2.map((it) => {
    const base = { section: "math" as const, domain: it.domain, skill: it.skill, difficulty: it.d, stem: it.stem, table: it.table, explanation: it.why };
    if (it.right) {
      const choices = placed[k++];
      return { ...base, id: hashId("m", it.stem + "|" + it.right), type: "mcq" as const, choices, answer: LETTERS[choices.indexOf(it.right)] };
    }
    return { ...base, id: hashId("m", it.stem + "|" + it.answer), type: "spr" as const, answer: it.answer! };
  });
}
