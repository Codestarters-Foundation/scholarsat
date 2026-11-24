/** Reading questions from rw-reading-more.ts. Uses its own seeded RNG, so adding or editing items here never
 *  changes the answer order of any other question in the bank. */
import { LETTERS, hashId, rng } from "./lib";
import type { Question } from "../src/lib/types";
import { CROSS_MORE, PURPOSE_MORE, SYNTH_MORE } from "./rw-reading-more";

const SYNTH_INTRO = "While researching a topic, a student has taken the following notes:\n";

export function generateRWMore(seed = 7171): Question[] {
  const r = rng(seed);
  const out: Question[] = [];
  // Right answers are spread evenly over A-D (a 16-question batch drawn at random can easily be half "A"),
  // in an order that is shuffled once by the seed. Wrong choices are shuffled into the remaining slots.
  const total = SYNTH_MORE.length + CROSS_MORE.length + PURPOSE_MORE.length;
  const slots = r.shuffle(Array.from({ length: total }, (_, i) => i % 4));
  let n = 0;
  const add = (o: Omit<Question, "id" | "section" | "type" | "choices" | "answer" | "explanation"> & { right: string; wrong: string[]; why: string }) => {
    const others = r.shuffle(o.wrong.slice(0, 3));
    const slot = slots[n++];
    const choices = [...others.slice(0, slot), o.right, ...others.slice(slot)];
    out.push({
      id: hashId("r", (o.passage ?? "") + "|" + o.stem + "|" + o.right),
      section: "rw", domain: o.domain, skill: o.skill, difficulty: o.difficulty, type: "mcq",
      passage: o.passage, passage2: o.passage2, stem: o.stem, choices,
      answer: LETTERS[choices.indexOf(o.right)], explanation: o.why,
    });
  };
  for (const s of SYNTH_MORE) {
    add({
      domain: "Expression of Ideas", skill: "Rhetorical Synthesis", difficulty: s.d,
      passage: SYNTH_INTRO + s.notes.map((n) => "• " + n).join("\n"),
      stem: `The student wants to ${s.goal}. Which choice most effectively uses relevant information from the notes to accomplish this goal?`,
      right: s.right, wrong: s.wrong, why: s.why,
    });
  }
  for (const it of CROSS_MORE) add({ domain: "Craft and Structure", skill: "Cross-Text Connections", difficulty: it.d, passage: it.passage, passage2: it.passage2, stem: it.stem, right: it.right, wrong: it.wrong, why: it.why });
  for (const it of PURPOSE_MORE) add({ domain: "Craft and Structure", skill: "Text Structure and Purpose", difficulty: it.d, passage: it.passage, stem: it.stem, right: it.right, wrong: it.wrong, why: it.why });
  return out;
}
