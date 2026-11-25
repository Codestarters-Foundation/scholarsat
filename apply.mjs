#!/usr/bin/env node
/**
 * 30 Reading and Writing + 30 math questions + 30 vocabulary words.
 *
 *   node apply.mjs <path-to-scholarsat-repo> [--dry]
 *
 * All-or-nothing, safe to run twice, preserves CRLF. Needs the tutor + reading-questions patch applied first.
 * `node apply.mjs --manual` prints every edit so you can make them by hand if an anchor does not match.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** New files: never overwrite a different file. */
const NEW_FILES = [
  "scripts/rw-more2.ts",
  "scripts/math-more2.ts",
  "scripts/gen-more2.ts",
  "src/data/vocab-more.ts",
  "tests/more-questions.test.ts",
];
const REPLACE = [];

const VOCAB_TAIL = [
  "/** Classic words first, then the words with a second meaning, as before. The newer words slot into their group. */",
  "export const VOCAB: Vocab[] = [",
  '  ...VOCAB_BASE.filter((v) => v.kind !== "context"),',
  '  ...VOCAB_MORE.filter((v) => v.kind !== "context"),',
  '  ...VOCAB_BASE.filter((v) => v.kind === "context"),',
  '  ...VOCAB_MORE.filter((v) => v.kind === "context"),',
  "];",
].join("\n");

const EDITS = [
  {
    file: "scripts/build-bank.ts",
    why: "Include the new reading and math questions.",
    edits: [
      { op: "after", anchor: 'import { generateRWMore } from "./gen-rw-more";', text: 'import { generateMathMore2, generateRWMore2 } from "./gen-more2";' },
      { op: "sub", find: "const math = generateMath(Number(process.env.PER_CELL ?? 60));", replace: "const math = [...generateMath(Number(process.env.PER_CELL ?? 60)), ...generateMathMore2()];" },
      { op: "sub", find: "...generateRWExtra(), ...generateRWMore()];", replace: "...generateRWExtra(), ...generateRWMore(), ...generateRWMore2()];" },
    ],
  },
  {
    file: "src/data/vocab.ts",
    why: "Add the 30 new words. The original list is renamed VOCAB_BASE and VOCAB is rebuilt from it at the bottom, so nothing that imports VOCAB changes.",
    edits: [
      { op: "sub", find: "export const VOCAB: Vocab[] = [", replace: 'import { VOCAB_MORE } from "./vocab-more";\n\nexport const VOCAB_BASE: Vocab[] = [' },
      { op: "append", marker: "export const VOCAB: Vocab[] = [", text: VOCAB_TAIL },
    ],
  },
  {
    file: "package.json",
    why: "Run the new tests as part of `npm run typecheck`.",
    edits: [{ op: "sub", find: 'tests/rw-more.test.ts"', replace: 'tests/rw-more.test.ts tests/more-questions.test.ts"' }],
  },
];

if (process.argv.includes("--manual")) {
  for (const f of EDITS) {
    console.log(`### ${f.file}`);
    for (const e of f.edits) console.log(e.op === "sub" ? `Replace \`${e.find}\` with:\n\`\`\`\n${e.replace}\n\`\`\`\n` : e.op === "append" ? `Add at the very end of the file:\n\`\`\`\n${e.text}\n\`\`\`\n` : `Insert ${e.op} the line \`${e.anchor}\`:\n\`\`\`\n${e.text}\n\`\`\`\n`);
  }
  process.exit(0);
}

const root = process.argv.slice(2).find((a) => !a.startsWith("--"));
const dry = process.argv.includes("--dry");
if (!root || !existsSync(path.join(root, "package.json"))) {
  console.error("Usage: node apply.mjs <path-to-scholarsat-repo> [--dry]");
  process.exit(2);
}
const problems = [], writes = [], notes = [];

for (const rel of NEW_FILES) {
  const src = readFileSync(path.join(HERE, rel), "utf8"), dest = path.join(root, rel);
  if (!existsSync(dest)) { writes.push({ dest, text: src }); notes.push(`+ ${rel}`); }
  else if (readFileSync(dest, "utf8") === src) notes.push(`= ${rel} (already there)`);
  else problems.push(`${rel} exists and is different. Not overwriting.`);
}
for (const { file, was } of REPLACE) {
  const src = readFileSync(path.join(HERE, file), "utf8"), dest = path.join(root, file);
  if (!existsSync(dest)) { problems.push(`${file} is missing. Apply the first BYOK patch before this update.`); continue; }
  const cur = readFileSync(dest, "utf8");
  if (cur === src) notes.push(`= ${file} (already updated)`);
  else if (cur.includes(was)) { writes.push({ dest, text: src }); notes.push(`~ ${file} (replaced)`); }
  else problems.push(`${file} has been changed since the first patch. Not overwriting; compare it with the copy in this folder.`);
}
for (const f of EDITS) {
  const dest = path.join(root, f.file);
  if (!existsSync(dest)) { problems.push(`${f.file} does not exist.`); continue; }
  const original = readFileSync(dest, "utf8"), eol = original.includes("\r\n") ? "\r\n" : "\n";
  let text = original.replace(/\r\n/g, "\n"), changed = 0;
  for (const e of f.edits) {
    const label = `${f.file}: ${e.op === "sub" ? JSON.stringify(e.find.slice(0, 50)) : e.op === "append" ? "append at end" : `${e.op} ${JSON.stringify(e.anchor.slice(0, 50))}`}`;
    if (e.op === "append") {
      if (text.includes(e.marker)) { notes.push(`= ${label} (already applied)`); continue; }
      text = text.replace(/\s*$/, "") + "\n\n" + e.text + "\n"; changed++; continue;
    }
    if (e.op === "sub") {
      if (text.includes(e.replace)) { notes.push(`= ${label} (already applied)`); continue; }
      const n = text.split(e.find).length - 1;
      if (n !== 1) { problems.push(`${label} found ${n} times (need exactly 1).`); continue; }
      text = text.replace(e.find, () => e.replace); changed++; continue;
    }
    const lines = text.split("\n");
    const marker = e.marker ?? e.text.split("\n").find((l) => l.trim())?.trim();
    if (lines.some((l) => l.trim() === marker)) { notes.push(`= ${label} (already applied)`); continue; }
    const hits = lines.map((l, i) => (l.trim() === e.anchor ? i : -1)).filter((i) => i >= 0);
    if (hits.length !== 1) { problems.push(`${label} matched ${hits.length} lines (need exactly 1).`); continue; }
    const i = hits[0], indent = lines[i].match(/^\s*/)[0];
    lines.splice(e.op === "after" ? i + 1 : i, 0, ...e.text.split("\n").map((l) => (l ? indent + l : l)));
    text = lines.join("\n"); changed++;
  }
  if (changed) { writes.push({ dest, text: text.replace(/\n/g, eol) }); notes.push(`~ ${f.file} (${changed} edit${changed === 1 ? "" : "s"})`); }
}
console.log(notes.join("\n"));
if (problems.length) {
  console.error("\nNothing was written. Fix these first (`node apply.mjs --manual` lists the edits to do by hand):");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
if (dry) { console.log("\nDry run: nothing written."); process.exit(0); }
for (const w of writes) { mkdirSync(path.dirname(w.dest), { recursive: true }); writeFileSync(w.dest, w.text); }
console.log(`\nDone. ${writes.length} file(s) written. Next: npm run typecheck && npm run lint && npm run build`);
