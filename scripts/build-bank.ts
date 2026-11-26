/** Builds src/data/questions.json from ScholarSAT's original generators. Run: npm run bank */
import { writeFileSync, mkdirSync } from "node:fs";
import { generateMath } from "./gen-math";
import { generateRW } from "./gen-rw";
import { generateRWExtra } from "./gen-rw-extra";
import { generateRWMore } from "./gen-rw-more";
import { generateMathMore2, generateRWMore2 } from "./gen-more2";

const newReading = [...generateRWMore(), ...generateRWMore2()];
const newMath = generateMathMore2();
const math = generateMath(Number(process.env.PER_CELL ?? 60));
const rw = [...generateRW(), ...generateRWExtra()];
const all = [...rw, ...math, ...[...newReading, ...newMath].map(q => ({ ...q, collection: "november-set" as const }))];

// An id collision would silently merge two questions' attempts, so fail the build instead.
const seen = new Set<string>();
for (const q of all) {
  if (seen.has(q.id)) throw new Error("duplicate question id " + q.id);
  seen.add(q.id);
}

mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/questions.json", JSON.stringify(all));
const by = (k: (q: (typeof all)[number]) => string) =>
  all.reduce<Record<string, number>>((acc, q) => ((acc[k(q)] = (acc[k(q)] ?? 0) + 1), acc), {});
console.log("total", all.length, "math", math.length + newMath.length, "rw", rw.length + newReading.length);
console.log(by((q) => `${q.section} ${q.skill}`));
console.log(by((q) => q.difficulty));
