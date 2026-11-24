#!/usr/bin/env node
/**
 * AI update: Groq, automatic model choice, guided key setup, onboarding step.
 *
 *   node apply.mjs <path-to-scholarsat-repo> [--dry]
 *
 * All-or-nothing, safe to run twice, preserves CRLF. Needs the earlier BYOK patch to be in the repo already.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** New files: never overwrite a different file. */
const NEW_FILES = ["src/components/AiConnect.tsx", "src/components/AiOnboardingStep.tsx", "tests/ai-connect.test.ts"];

/** Files from the first BYOK patch that this update replaces. Only replaced if they still look like our earlier version. */
const REPLACE = [
  { file: "src/lib/ai.ts", was: "Bring-your-own-key AI." },
  { file: "src/components/AiSettings.tsx", was: "Provider, key and model for the optional AI helpers" },
  { file: "src/components/AiAsk.tsx", was: 'An optional "ask AI" button' },
];

const EDITS = [
  {
    file: "src/components/onboarding/Onboarding.tsx",
    edits: [
      { op: "after", anchor: 'import { ScoreCurve } from "./ScoreCurve";', text: 'import { AiOnboardingStep } from "../AiOnboardingStep";' },
      { op: "sub", find: '"focus", "plan"] as const', replace: '"focus", "ai", "plan"] as const' },
      { op: "after", anchor: "focus: a.focus.length > 0 || notSure,", text: "ai: true," },
      {
        op: "before",
        anchor: 'case "plan":',
        text: [
          'case "ai":',
          '  return { mood: "idle", text: "Totally optional. If you want an AI helper, I\'ll walk you through it. You can also skip this and do it later." };',
        ].join("\n"),
      },
      {
        op: "before",
        anchor: "welcome: {",
        text: [
          "ai: {",
          '  title: "Want an AI study helper?",',
          '  sub: "Optional. It can be free, and you can set it up later.",',
          "  body: <AiOnboardingStep />,",
          "},",
        ].join("\n"),
      },
      { op: "sub", find: 'step === "focus" ? "Build my plan"', replace: 'step === "ai" ? "Build my plan"' },
    ],
  },
  {
    file: "package.json",
    edits: [{ op: "sub", find: 'tests/ai.test.ts"', replace: 'tests/ai.test.ts tests/ai-connect.test.ts"' }],
  },
];

if (process.argv.includes("--manual")) {
  for (const f of EDITS) {
    console.log(`### ${f.file}`);
    for (const e of f.edits) console.log(e.op === "sub" ? `Replace \`${e.find}\` with \`${e.replace}\`\n` : `Insert ${e.op} the line \`${e.anchor}\`:\n\`\`\`\n${e.text}\n\`\`\`\n`);
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
    const label = `${f.file}: ${e.op === "sub" ? JSON.stringify(e.find.slice(0, 50)) : `${e.op} ${JSON.stringify(e.anchor.slice(0, 50))}`}`;
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
