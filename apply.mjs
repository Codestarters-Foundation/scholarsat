#!/usr/bin/env node
/**
 * Drawing tutor + 16 new reading questions.
 *
 *   node apply.mjs <path-to-scholarsat-repo> [--dry]
 *
 * All-or-nothing, safe to run twice, preserves CRLF. Needs the earlier BYOK and AI-setup patches in the repo already.
 * `node apply.mjs --manual` prints every edit so you can make them by hand if an anchor does not match.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** New files: never overwrite a different file. */
const NEW_FILES = [
  "src/lib/tutor-lesson.ts",
  "src/lib/tutor-anchor.ts",
  "src/lib/tutor-store.ts",
  "src/components/tutor/TutorTray.tsx",
  "src/components/tutor/TutorMarks.tsx",
  "src/components/tutor/Whiteboard.tsx",
  "src/components/tutor/TeachButton.tsx",
  "scripts/rw-reading-more.ts",
  "scripts/gen-rw-more.ts",
  "tests/tutor-lesson.test.ts",
  "tests/rw-more.test.ts",
];
const REPLACE = [];

const EDITS = [
  {
    file: "src/lib/ai.ts",
    why: "Let a request ask for a longer reply (the tutor's replies are JSON and need more room than the 1024-token default).",
    edits: [
      {
        op: "sub",
        find: "export function buildRequest(cfg: AiConfig, system: string, messages: ChatMessage[], signal?: AbortSignal): Req {",
        replace: [
          "/** Reply length cap. Only Groq and Anthropic need one sent; for Gemini and OpenAI it would also cut into the model's thinking. */",
          "export const DEFAULT_MAX_TOKENS = 1024;",
          "",
          "export function buildRequest(cfg: AiConfig, system: string, messages: ChatMessage[], signal?: AbortSignal, maxTokens: number = DEFAULT_MAX_TOKENS): Req {",
        ].join("\n"),
      },
      { op: "sub", find: "stream: true, max_completion_tokens: 1024 }", replace: "stream: true, max_completion_tokens: maxTokens }" },
      { op: "sub", find: "max_tokens: 1024, system, messages, stream: true }", replace: "max_tokens: maxTokens, system, messages, stream: true }" },
      {
        op: "sub",
        find: "  signal?: AbortSignal;\n  fetchImpl?: typeof fetch;\n};",
        replace: "  signal?: AbortSignal;\n  fetchImpl?: typeof fetch;\n  /** Longest reply to allow (default 1024). The drawing tutor asks for more because its replies are JSON. */\n  maxTokens?: number;\n};",
      },
      { op: "sub", find: "buildRequest(cfg, opts.system, opts.messages, opts.signal);", replace: "buildRequest(cfg, opts.system, opts.messages, opts.signal, opts.maxTokens);" },
    ],
  },
  {
    file: "src/components/AiAsk.tsx",
    why: "Bug fix: pressing Enter on the Explain button, or in the key box inside it, also moved to the next question, because the practice screen listens for Enter on the whole window.",
    edits: [
      {
        op: "sub",
        find: "export function AiAsk({ label, system, prompt }: { label: string; system: string; prompt: string }) {",
        replace: [
          "export function AiAsk(props: { label: string; system: string; prompt: string }) {",
          "  // The practice screen listens for Enter and the arrow keys on the whole window (check / next / back). Keys",
          "  // pressed in here, such as Enter on the button or in the key box, belong to this widget, not to the screen.",
          "  return (",
          '    <div className="contents" onKeyDown={(e) => e.stopPropagation()}>',
          "      <AiAskInner {...props} />",
          "    </div>",
          "  );",
          "}",
          "",
          "function AiAskInner({ label, system, prompt }: { label: string; system: string; prompt: string }) {",
        ].join("\n"),
      },
    ],
  },
  {
    file: "src/components/PracticePlayer.tsx",
    why: "Add the Teach me button (result card) and the tutor tray (between the question and the bottom bar).",
    edits: [
      { op: "after", anchor: 'import { AiAsk } from "./AiAsk";', text: 'import { TeachButton } from "./tutor/TeachButton";\nimport { TutorTray } from "./tutor/TutorTray";' },
      { op: "before", marker: "<TeachButton qid={q.id} />", anchor: "{!result.saved && (", text: ['<div className="mt-3">', "  <TeachButton qid={q.id} />", "</div>"].join("\n") },
      {
        op: "before",
        marker: "<TutorTray",
        anchor: "{/* Bottom bar */}",
        text: ["{q && result && (", "  <TutorTray", "    key={q.id}", "    q={q}", "    response={resp}", "    answer={result.answer}", "    explanation={result.explanation}", "    correct={result.correct}", "  />", ")}"].join("\n"),
      },
    ],
  },
  {
    file: "scripts/build-bank.ts",
    why: "Include the new reading questions.",
    edits: [
      { op: "after", anchor: 'import { generateRWExtra } from "./gen-rw-extra";', text: 'import { generateRWMore } from "./gen-rw-more";' },
      { op: "sub", find: "const rw = [...generateRW(), ...generateRWExtra()];", replace: "const rw = [...generateRW(), ...generateRWExtra(), ...generateRWMore()];" },
    ],
  },
  {
    file: "package.json",
    why: "Run the new tests as part of `npm run typecheck`.",
    edits: [{ op: "sub", find: 'tests/ai-connect.test.ts"', replace: 'tests/ai-connect.test.ts tests/tutor-lesson.test.ts tests/rw-more.test.ts"' }],
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
