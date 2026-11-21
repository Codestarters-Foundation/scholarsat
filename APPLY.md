# ScholarSAT: Bring-your-own-AI + new Vocab "Learn" mode

Do this on a branch and open a PR. Do not push straight to `main`: a push to main auto-deploys when `DEPLOY_ENABLED` is set.

```bash
cd scholarsat
git checkout -b feat/byok-ai-vocab-learn
node /path/to/scholarsat-patch/apply.mjs . --dry   # preview, writes nothing
node /path/to/scholarsat-patch/apply.mjs .         # apply
npm run typecheck && npm run lint && npm run build
npm run dev
```

`apply.mjs` is all-or-nothing (if any anchor is missing it writes nothing), safe to run twice, and never overwrites a different existing file. If it reports a problem, do the edits by hand from the list at the bottom (`node apply.mjs --manual` prints the same list).

## What you get
**Vocab Learn mode** (new default tab, flashcards/browse/quiz stay): spaced repetition (Leitner boxes, 1/3/7/16/35 days). New words get an intro card, then the question type gets harder as the word is learned: pick the word for a definition, then SAT-style fill-in-the-blank from the example sentence, then typed recall. Misses come back a few cards later as a different question. Signed-in progress is saved server-side (`POST /api/vocab/review`); signed-out progress is saved in the browser. Words reaching box 4 count as "known" in the existing counter.

**Bring your own AI (BYOK)**: Settings has a new "Bring your own AI" card (OpenAI, Anthropic, Gemini). The key stays in the user's browser (localStorage) and calls go browser -> provider directly; the server never sees it. Used for an "Explain this" button after practice questions and a "Memory trick" button in Learn mode. Works signed out and stays optional, so the app remains free and ungated.

**Not built: "Sign in with ChatGPT".** OpenAI's plan-usage sign-in is for open-source/local apps (loopback redirect); a hosted site needs to apply via OpenAI's interest form: https://openai.com/form/sign-in-with-chatgpt-interest/ . Worth submitting (CodeStarters is an open-source nonprofit).

## Verified vs. NOT verified
Verified (in a stand-in harness, not the real repo):
- 45 unit tests pass (SRS, question generation on the real 979-word bank, AI request/stream parsing with a mocked fetch). They are wired into `npm run typecheck` via `test:logic`.
- 51 browser checks (Playwright) of the Learn flow, AI key form and AI panel, including hydration and tab switching.
- 16 checks of the review route's SQL against real SQLite incl. legacy rows.
- `apply.mjs` run against files rebuilt from your repo dump (apply, twice, CRLF, missing anchor).

NOT verified, please check before merging:
1. The real `next build` and ESLint (I had no repo checkout or installs). Run the command line above.
2. Live provider calls. Open Settings -> Bring your own AI, paste a key, press **Test** and **Load models**. The default model names (`gpt-5.4-mini`, `claude-haiku-5-5`, `gemini-3.8-flash`) are unconfirmed guesses; "Load models" lists real ones. Fix the defaults in `src/lib/ai.ts` (`PROVIDERS`) if needed.
3. The edits to existing files were anchored on text from your dump, which lost indentation. Skim `git diff` for the 6 existing files (list below).
4. The PracticePlayer "Explain this" integration was designed against the dump but not compiled in the real file.

## Edits to existing files
### `src/lib/db.ts`
Add the spaced-repetition columns to vocab_progress (same migration style as the existing ones).

Insert **before** the line `return db;`:
```tsx
// Vocabulary spaced repetition (Learn mode)
for (const [col, ddl] of [["box", "INTEGER DEFAULT 0"], ["due_at", "INTEGER"], ["reps", "INTEGER DEFAULT 0"], ["lapses", "INTEGER DEFAULT 0"]] as const) {
  if (vocabCols.has(col)) continue;
  try {
    db.exec(`ALTER TABLE vocab_progress ADD COLUMN ${col} ${ddl}`);
  } catch (e) {
    if (!String(e).includes("duplicate column")) throw e;
  }
}
db.exec("CREATE INDEX IF NOT EXISTS vocab_progress_due ON vocab_progress(user_id, due_at)");
```

### `src/app/(app)/vocab/page.tsx`
Load each word's schedule and pass it to the study screen.

Insert **after** the line `import { VocabStudy } from "@/components/VocabStudy";`:
```tsx
import type { SrsState } from "@/lib/srs";
```

Insert **after** the line `let starred: string[] = [];`:
```tsx
const srs: Record<string, SrsState> = {};
```

Insert **after** the line `starred = rows.filter((r) => r.starred === 1).map((r) => r.word);`:
```tsx
const srsRows = db
  .prepare("SELECT word, box, due_at, reps, lapses FROM vocab_progress WHERE user_id = ? AND due_at IS NOT NULL")
  .all(user.id) as { word: string; box: number; due_at: number; reps: number; lapses: number }[];
for (const r of srsRows) srs[r.word] = { box: r.box, due: r.due_at, reps: r.reps, lapses: r.lapses };
```

Find this text (it appears once) and replace it:
```
initialStarred={starred}
```
with:
```
initialStarred={starred} initialSrs={srs}
```

### `src/components/VocabStudy.tsx`
Add the Learn tab (default), keep it mounted so progress isn't reset, and hide the flashcard deck pills while it's open.

Insert **after** the line `import { Owl } from "./Owl";`:
```tsx
import { VocabLearn } from "./VocabLearn";
import type { SrsState } from "@/lib/srs";
```

Insert **after** the line `ICards,`:
```tsx
ISparkle,
```

Find this text (it appears once) and replace it:
```
"flashcards" | "browse" | "quiz"
```
with:
```
"learn" | "flashcards" | "browse" | "quiz"
```

Insert **after** the line `initialStarred = [],`:
```tsx
initialSrs = {},
```

Insert **after** the line `initialStarred?: string[];`:
```tsx
initialSrs?: Record<string, SrsState>;
```

Find this text (it appears once) and replace it:
```
useState<StudyMode>("flashcards")
```
with:
```
useState<StudyMode>("learn")
```

Insert **before** the line `// Next / Prev flashcard handlers`:
```tsx
// Learn mode promotes and demotes words on its own; keep the local mastered count in step (the server already saved it).
const syncKnown = useCallback((word: string, isKnown: boolean) => {
  setKnown((prev) => {
    if (prev.has(word) === isKnown) return prev;
    const next = new Set(prev);
    if (isKnown) next.add(word);
    else next.delete(word);
    return next;
  });
}, []);
```

Insert **after** the line `<div className="inline-flex rounded-xl bg-surface-2 p-1 gap-1">`:
```tsx
<button
  type="button"
  onClick={() => setMode("learn")}
  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
    mode === "learn"
      ? "bg-bg text-ink shadow-xs"
      : "text-muted hover:text-ink hover:bg-bg/50"
  }`}
>
  <ISparkle className="h-4 w-4" /> Learn
</button>
```

Find this text (it appears once) and replace it:
```
className="flex items-center gap-1.5 overflow-x-auto
```
with:
```
hidden={mode === "learn"} className="flex items-center gap-1.5 overflow-x-auto
```

Insert **before** the line `{/* ---------------- MODE 1: FLASHCARDS ---------------- */}`:
```tsx
{/* ---------------- MODE 0: LEARN (kept mounted so a session survives switching tabs) ---------------- */}
<div hidden={mode !== "learn"}>
  <VocabLearn
    words={words}
    known={known}
    initialSrs={initialSrs}
    signedIn={signedIn}
    onMasteryChange={syncKnown}
    active={mode === "learn"}
  />
</div>
```

### `src/app/(app)/settings/page.tsx`
Show the 'Bring your own AI' card on the Settings page.

Insert **after** the line `import { SettingsForms } from "@/components/SettingsForms";`:
```tsx
import { AiSettings } from "@/components/AiSettings";
```

Insert **before** the line `<SettingsForms`:
```tsx
<div className="mb-6"><AiSettings /></div>
```

### `src/components/PracticePlayer.tsx`
Add the optional 'Explain' (AI) button under the official explanation.

Insert **after** the line `import { Owl } from "./Owl";`:
```tsx
import { AiAsk } from "./AiAsk";
import { TUTOR_SYSTEM, explainQuestionPrompt } from "@/lib/ai-prompts";
```

Insert **after** the line `<div className="mt-3 text-[15px] text-ink"><Rich text={result.explanation} /></div>`:
```tsx
<div className="mt-4">
  <AiAsk
    key={q.id}
    label="Explain this"
    system={TUTOR_SYSTEM}
    prompt={explainQuestionPrompt(q, resp, result.answer, result.explanation, result.correct)}
  />
</div>
```

### `package.json`
Run the new logic tests as part of `npm run typecheck` (so CI runs them).

Find this text (it appears once) and replace it:
```
"test:theme": "node --test tests/theme-contrast.test.mjs",
```
with:
```
"test:theme": "node --test tests/theme-contrast.test.mjs",
    "test:logic": "node --import tsx --test tests/srs.test.ts tests/vocab-learn.test.ts tests/ai.test.ts",
```

Find this text (it appears once) and replace it:
```
"pretypecheck": "npm run test:theme"
```
with:
```
"pretypecheck": "npm run test:theme && npm run test:logic"
```

