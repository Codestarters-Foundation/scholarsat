# Reading bank +39 questions (and what's still open)

Branch (from an up-to-date `main`; if the BYOK/Learn PR isn't merged yet, branch from `feat/byok-ai-vocab-learn` instead):

    git checkout -b feat/more-reading-qs-ui-sweep

## 1. Add the questions (2 new files, 1 edit)
Copy into your repo:
- `scripts/rw-reading-extra.ts`  (the 39 questions)
- `scripts/gen-rw-extra.ts`      (turns them into bank entries with its own seeded RNG, so no existing question's answer order changes)

Edit `scripts/build-bank.ts`:

    import { generateRWExtra } from "./gen-rw-extra";        // add under the other imports
    ...
    const rw = [...generateRW(), ...generateRWExtra()];        // was: const rw = generateRW();

and right after `const all = [...rw, ...math];` add a guard so an id collision can never ship silently:

    const seen = new Set<string>();
    for (const q of all) { if (seen.has(q.id)) throw new Error("duplicate question id " + q.id); seen.add(q.id); }

Then `npm run bank && npm run typecheck && npm run build`. The log should show rw going up by 39.

What's in it: Central Ideas 6, Inferences 8, Command of Evidence 5, Text Structure and Purpose 6, Cross-Text 6, Words in Context 8 (E/M/H mix). All passages are original; people, studies and places are fictional.

Checked: unique ids, 4 distinct choices, valid answer letters, blanks and Text 1/Text 2 structure, deterministic output (run against your generator helpers from the dump). NOT checked: against your real question bank for duplicate ids (the build guard above does that), or by a second reader.

Known weakness: in 37 of 39 items the right answer is the longest choice, which test-takers can learn to exploit. Worth a pass to lengthen the wrong answers.

Heads up: the daily question is picked as `pool[hash(day) % pool.length]` over non-easy MCQs. Adding questions changes pool.length, so TODAY's reading daily question changes for everyone the moment this deploys, and votes already cast for the old one stay under the old question. Deploy just after 00:00 UTC.

## 2. Skill install (run inside your repo)

    npx -y skills add emilkowalski/skills --skill emil-design-eng -y

(Source: https://github.com/emilkowalski/skills). I couldn't run this: installs are blocked in my environment.

## 3. Diagnostics: answer input + correct answer after (new)
New files: `src/lib/daily-answer.ts`, `src/app/api/daily/answer/route.ts`, `src/components/diagnostics/DailyAnswerCard.tsx`.
Replaced file: `src/app/(app)/diagnostics/page.tsx` (adds the card above the stats). If your live copy of that page differs from the one I had, don't overwrite it: add the 3 imports, the two `polls`/`reveals` lines and `<div className="mb-6"><DailyAnswerCard polls={polls} reveals={reveals} /></div>` by hand.

How it behaves: a Math / Reading & Writing tab pair shows today's daily question with A-D choices and a Submit button. Submitting casts your daily vote (same one-vote-per-day rule; your first answer stays). Only after you've voted does the server send the correct answer, whether you were right, the explanation and the % of people who picked each choice. If you already voted on /daily, the result is there when you open Diagnostics. Not voted = the answer is never sent to your browser.

Two behavior notes: (1) this reveals the answer to people who have voted; the old route comment says the daily poll "never reveals the answer", so the comment on `src/app/api/daily/route.ts` is now only true for that route. (2) These answers do NOT count as practice attempts, so they don't change the predicted score or attempt totals. Say if you want them to.

Tested here with stand-ins for your UI parts: 20 browser checks (Chromium) on the card incl. server-HTML hydration, no answer in the page before voting, locked choices, failure + retry; 13 checks on the endpoint and reveal logic against SQLite (401 signed out, bad input, first pick locked, no reveal for non-voters). Not tested: your real `Rich`, `HeaderCard` and icons, `npm run build`, or lint.
