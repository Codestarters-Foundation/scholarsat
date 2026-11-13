/** Builds src/data/questions.json from ScholarSAT's original generators. Run: npm run bank */
import { writeFileSync, mkdirSync } from "node:fs";
import { generateMath } from "./gen-math";
import { generateRW } from "./gen-rw";

const math = generateMath(Number(process.env.PER_CELL ?? 60));
const rw = generateRW();
const all = [...rw, ...math];

mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/questions.json", JSON.stringify(all));

const by = (k: (q: (typeof all)[number]) => string) =>
  all.reduce<Record<string, number>>((acc, q) => ((acc[k(q)] = (acc[k(q)] ?? 0) + 1), acc), {});
console.log("total", all.length, "math", math.length, "rw", rw.length);
console.log(by((q) => `${q.section} ${q.skill}`));
console.log(by((q) => q.difficulty));
