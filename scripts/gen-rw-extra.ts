/** Extra reading questions. Kept apart from gen-rw.ts on purpose: it uses its own seeded RNG, so adding
 *  or editing items here never changes the answer order of any existing question. */
import { LETTERS, hashId, rng } from "./lib";
import type { Difficulty, Question } from "../src/lib/types";
import { ALL_READING_X, WIC_X } from "./rw-reading-extra";

const WIC_STEM = "Which choice completes the text with the most logical and precise word or phrase?";

export function generateRWExtra(seed = 4242): Question[] {
  const r = rng(seed);
  const out: Question[] = [];
  const add = (o: { domain: string; skill: string; d: Difficulty; passage: string; passage2?: string; stem: string; right: string; wrong: string[]; why: string }) => {
    const choices = r.shuffle([o.right, ...o.wrong.slice(0, 3)]);
    out.push({
      id: hashId("r", o.passage + "|" + o.stem + "|" + o.right),
      section: "rw", domain: o.domain, skill: o.skill, difficulty: o.d, type: "mcq",
      passage: o.passage, passage2: o.passage2, stem: o.stem, choices,
      answer: LETTERS[choices.indexOf(o.right)], explanation: o.why,
    });
  };
  for (const g of ALL_READING_X) {
    for (const it of g.items) add({ domain: g.domain, skill: g.skill, d: it.d, passage: it.passage, passage2: it.passage2, stem: it.stem, right: it.right, wrong: it.wrong, why: it.why });
  }
  for (const w of WIC_X) {
    add({ domain: "Craft and Structure", skill: "Words in Context", d: w.d, passage: w.text, stem: WIC_STEM, right: w.right, wrong: w.wrong, why: w.why });
  }
  return out;
}
