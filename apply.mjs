#!/usr/bin/env node
/**
 * Applies the "BYOK AI + Vocab Learn" change to a ScholarSAT checkout.
 *
 *   node apply.mjs <path-to-scholarsat-repo>            apply
 *   node apply.mjs <path-to-scholarsat-repo> --dry      show what would change, write nothing
 *   node apply.mjs --manual                             print every edit as Markdown (for doing it by hand)
 *
 * Safe by design:
 *  - All-or-nothing: if any anchor line is missing or ambiguous, NOTHING is written.
 *  - Idempotent: edits that are already in place are skipped, so it can be run twice.
 *  - Anchors are matched on trimmed lines, so indentation differences don't matter.
 *  - New files are never overwritten if they already exist with different content.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const snippet = (name) => readFileSync(path.join(HERE, "snippets", name), "utf8").replace(/\s+$/, "");

const NEW_FILES = [
  "src/lib/srs.ts",
  "src/lib/vocab-learn.ts",
  "src/lib/ai.ts",
  "src/lib/ai-prompts.ts",
  "src/lib/use-ai-config.ts",
  "src/app/api/vocab/review/route.ts",
  "src/components/VocabLearn.tsx",
  "src/components/AiAsk.tsx",
  "src/components/AiSettings.tsx",
  "tests/srs.test.ts",
  "tests/vocab-learn.test.ts",
  "tests/ai.test.ts",
];

/** op: "after" | "before" insert `text` next to the single line whose trimmed text equals `anchor`; "sub" replaces the single occurrence of `find`. */
const EDITS = [
  {
    file: "src/lib/db.ts",
    why: "Add the spaced-repetition columns to vocab_progress (same migration style as the existing ones).",
    edits: [{ op: "before", anchor: "return db;", text: snippet("db-migration.txt") }],
  },
  {
    file: "src/app/(app)/vocab/page.tsx",
    why: "Load each word's schedule and pass it to the study screen.",
    edits: [
      { op: "after", anchor: 'import { VocabStudy } from "@/components/VocabStudy";', text: 'import type { SrsState } from "@/lib/srs";' },
      { op: "after", anchor: "let starred: string[] = [];", text: "const srs: Record<string, SrsState> = {};" },
      {
        op: "after",
        anchor: "starred = rows.filter((r) => r.starred === 1).map((r) => r.word);",
        text: [
          "const srsRows = db",
          '  .prepare("SELECT word, box, due_at, reps, lapses FROM vocab_progress WHERE user_id = ? AND due_at IS NOT NULL")',
          "  .all(user.id) as { word: string; box: number; due_at: number; reps: number; lapses: number }[];",
          "for (const r of srsRows) srs[r.word] = { box: r.box, due: r.due_at, reps: r.reps, lapses: r.lapses };",
        ].join("\n"),
      },
      { op: "sub", find: "initialStarred={starred}", replace: "initialStarred={starred} initialSrs={srs}" },
    ],
  },
  {
    file: "src/components/VocabStudy.tsx",
    why: "Add the Learn tab (default), keep it mounted so progress isn't reset, and hide the flashcard deck pills while it's open.",
    edits: [
      { op: "after", anchor: 'import { Owl } from "./Owl";', text: 'import { VocabLearn } from "./VocabLearn";\nimport type { SrsState } from "@/lib/srs";' },
      { op: "after", anchor: "ICards,", text: "ISparkle," },
      { op: "sub", find: '"flashcards" | "browse" | "quiz"', replace: '"learn" | "flashcards" | "browse" | "quiz"' },
      { op: "after", anchor: "initialStarred = [],", text: "initialSrs = {}," },
      { op: "after", anchor: "initialStarred?: string[];", text: "initialSrs?: Record<string, SrsState>;" },
      { op: "sub", find: 'useState<StudyMode>("flashcards")', replace: 'useState<StudyMode>("learn")' },
      {
        op: "before",
        anchor: "// Next / Prev flashcard handlers",
        text: [
          "// Learn mode promotes and demotes words on its own; keep the local mastered count in step (the server already saved it).",
          "const syncKnown = useCallback((word: string, isKnown: boolean) => {",
          "  setKnown((prev) => {",
          "    if (prev.has(word) === isKnown) return prev;",
          "    const next = new Set(prev);",
          "    if (isKnown) next.add(word);",
          "    else next.delete(word);",
          "    return next;",
          "  });",
          "}, []);",
        ].join("\n"),
      },
      {
        op: "after",
        marker: '<ISparkle className="h-4 w-4" /> Learn',
        anchor: '<div className="inline-flex rounded-xl bg-surface-2 p-1 gap-1">',
        text: [
          "<button",
          '  type="button"',
          '  onClick={() => setMode("learn")}',
          "  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${",
          '    mode === "learn"',
          '      ? "bg-bg text-ink shadow-xs"',
          '      : "text-muted hover:text-ink hover:bg-bg/50"',
          "  }`}",
          ">",
          '  <ISparkle className="h-4 w-4" /> Learn',
          "</button>",
        ].join("\n"),
      },
      { op: "sub", find: 'className="flex items-center gap-1.5 overflow-x-auto', replace: 'hidden={mode === "learn"} className="flex items-center gap-1.5 overflow-x-auto' },
      {
        op: "before",
        anchor: "{/* ---------------- MODE 1: FLASHCARDS ---------------- */}",
        text: [
          "{/* ---------------- MODE 0: LEARN (kept mounted so a session survives switching tabs) ---------------- */}",
          '<div hidden={mode !== "learn"}>',
          "  <VocabLearn",
          "    words={words}",
          "    known={known}",
          "    initialSrs={initialSrs}",
          "    signedIn={signedIn}",
          "    onMasteryChange={syncKnown}",
          '    active={mode === "learn"}',
          "  />",
          "</div>",
        ].join("\n"),
      },
    ],
  },
  {
    file: "src/app/(app)/settings/page.tsx",
    why: "Show the 'Bring your own AI' card on the Settings page.",
    edits: [
      { op: "after", anchor: 'import { SettingsForms } from "@/components/SettingsForms";', text: 'import { AiSettings } from "@/components/AiSettings";' },
      { op: "before", anchor: "<SettingsForms", text: '<div className="mb-6"><AiSettings /></div>' },
    ],
  },
  {
    file: "src/components/PracticePlayer.tsx",
    why: "Add the optional 'Explain' (AI) button under the official explanation.",
    edits: [
      { op: "after", anchor: 'import { Owl } from "./Owl";', text: 'import { AiAsk } from "./AiAsk";\nimport { TUTOR_SYSTEM, explainQuestionPrompt } from "@/lib/ai-prompts";' },
      {
        op: "after",
        marker: 'label="Explain this"',
        anchor: '<div className="mt-3 text-[15px] text-ink"><Rich text={result.explanation} /></div>',
        text: [
          '<div className="mt-4">',
          "  <AiAsk",
          "    key={q.id}",
          '    label="Explain this"',
          "    system={TUTOR_SYSTEM}",
          "    prompt={explainQuestionPrompt(q, resp, result.answer, result.explanation, result.correct)}",
          "  />",
          "</div>",
        ].join("\n"),
      },
    ],
  },
  {
    file: "package.json",
    why: "Run the new logic tests as part of `npm run typecheck` (so CI runs them).",
    edits: [
      {
        op: "sub",
        find: '"test:theme": "node --test tests/theme-contrast.test.mjs",',
        replace:
          '"test:theme": "node --test tests/theme-contrast.test.mjs",\n    "test:logic": "node --import tsx --test tests/srs.test.ts tests/vocab-learn.test.ts tests/ai.test.ts",',
      },
      { op: "sub", find: '"pretypecheck": "npm run test:theme"', replace: '"pretypecheck": "npm run test:theme && npm run test:logic"' },
    ],
  },
];

// --------------------------------------------------------------------------- manual mode

if (process.argv.includes("--manual")) {
  const out = [];
  for (const f of EDITS) {
    out.push(`### \`${f.file}\``, f.why, "");
    for (const e of f.edits) {
      if (e.op === "sub") {
        out.push("Find this text (it appears once) and replace it:", "```", e.find, "```", "with:", "```", e.replace, "```", "");
      } else {
        out.push(`Insert **${e.op === "after" ? "after" : "before"}** the line \`${e.anchor}\`:`, "```tsx", e.text, "```", "");
      }
    }
  }
  console.log(out.join("\n"));
  process.exit(0);
}

// ---------------------------------------------------------------------------- apply mode

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dry = process.argv.includes("--dry");
const root = args[0];
if (!root) {
  console.error("Usage: node apply.mjs <path-to-scholarsat-repo> [--dry]");
  process.exit(2);
}
if (!existsSync(path.join(root, "package.json")) || !existsSync(path.join(root, "src/lib/db.ts"))) {
  console.error(`"${root}" does not look like the ScholarSAT repo (no package.json or src/lib/db.ts).`);
  process.exit(2);
}

const problems = [];
const writes = [];
const notes = [];

// 1. new files
for (const rel of NEW_FILES) {
  const src = readFileSync(path.join(HERE, rel), "utf8");
  const dest = path.join(root, rel);
  if (existsSync(dest)) {
    if (readFileSync(dest, "utf8") === src) notes.push(`= ${rel} (already there, identical)`);
    else problems.push(`${rel} already exists and is different. Not overwriting. Compare it with the copy in this folder.`);
  } else {
    writes.push({ dest, text: src });
    notes.push(`+ ${rel} (new file)`);
  }
}

// 2. edits to existing files
for (const f of EDITS) {
  const dest = path.join(root, f.file);
  if (!existsSync(dest)) {
    problems.push(`${f.file} does not exist.`);
    continue;
  }
  const original = readFileSync(dest, "utf8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  let text = original.replace(/\r\n/g, "\n");
  let changed = 0;
  for (const e of f.edits) {
    const label = `${f.file}: ${e.op === "sub" ? JSON.stringify(e.find.slice(0, 60)) : `${e.op} line ${JSON.stringify(e.anchor.slice(0, 60))}`}`;
    if (e.op === "sub") {
      if (text.includes(e.replace)) { notes.push(`= ${label} (already applied)`); continue; }
      const n = text.split(e.find).length - 1;
      if (n !== 1) { problems.push(`${label} found ${n} times (need exactly 1).`); continue; }
      text = text.replace(e.find, () => e.replace);
      changed++;
      continue;
    }
    const lines = text.split("\n");
    const marker = e.marker ?? e.text.split("\n").find((l) => l.trim())?.trim();
    if (lines.some((l) => l.trim() === marker)) { notes.push(`= ${label} (already applied)`); continue; }
    const hits = lines.map((l, i) => (l.trim() === e.anchor ? i : -1)).filter((i) => i >= 0);
    if (hits.length !== 1) { problems.push(`${label} matched ${hits.length} lines (need exactly 1).`); continue; }
    const i = hits[0];
    const indent = lines[i].match(/^\s*/)[0];
    const block = e.text.split("\n").map((l) => (l ? indent + l : l));
    lines.splice(e.op === "after" ? i + 1 : i, 0, ...block);
    text = lines.join("\n");
    changed++;
  }
  if (changed) {
    writes.push({ dest, text: text.replace(/\n/g, eol) });
    notes.push(`~ ${f.file} (${changed} edit${changed === 1 ? "" : "s"})`);
  }
}

console.log(notes.join("\n"));
if (problems.length) {
  console.error("\nNothing was written. Fix these first (use `node apply.mjs --manual` to do them by hand):");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
if (dry) {
  console.log("\nDry run: nothing written.");
  process.exit(0);
}
for (const w of writes) {
  mkdirSync(path.dirname(w.dest), { recursive: true });
  writeFileSync(w.dest, w.text);
}
console.log(`\nDone. ${writes.length} file(s) written. Next: npm run typecheck && npm run lint && npm run build`);
