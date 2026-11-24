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





# AI update: easier key setup, Groq, onboarding step

Branch (from the branch that already has the BYOK patch, or from main once that's merged):

    git checkout -b feat/ai-setup-onboarding-groq

Apply (run from anywhere; `.` is your repo root):

    node apply.mjs . --dry     # preview, writes nothing
    node apply.mjs .           # apply
    npm install && npm run typecheck && npm run lint && npm run build && npm run dev

`apply.mjs` is all-or-nothing and safe to run twice. It adds 3 new files, replaces 3 files from the first BYOK patch
(only if they're still unchanged since then), and makes 7 small edits to `Onboarding.tsx` and `package.json`.
`node apply.mjs --manual` prints those edits if an anchor doesn't match your file.

## What changed
- **Nobody needs to know a model name.** "Connect" checks the key, asks the service what it offers, picks a good model, and
  sends one tiny test message. A "model" field exists only under a collapsed "Advanced" section. If a service retires the
  model later, the AI button quietly switches to a working one and retries once.
- **Guided setup (new `AiConnect.tsx`)**: 1) pick a service (cards labelled Free / Paid), 2) three plain steps plus an
  "Open ..." button for getting a key, 3) paste and Connect. Catches a key pasted into the wrong service, cleans spaces and
  quotes, masks the key with Show/Hide, and never shows it again after connecting.
- **Groq added** (OpenAI-compatible, streaming). **Free options come first: Google Gemini (preselected), then Groq.** OpenAI and
  Anthropic are marked Paid and explain that a ChatGPT/Claude subscription doesn't include API use.
- **Onboarding step "Want an AI study helper?"** (between "focus" and the plan). Yes opens the setup right there, Not now just moves on.
  It never blocks Continue and works for guests (the key stays in the browser).
- Settings card renamed "AI study helper". The AI buttons' link now says "set up free AI".

## Read this before merging
1. **Groq may not work from a browser.** I could not call Groq from here. One article I found says Groq doesn't send the
   headers a browser needs (CORS), and I couldn't confirm or disprove it. If it's true, Groq needs a small server relay,
   which would mean the key passes through your server (against our "key never leaves the browser" promise). Test it first
   with a real Groq key: Settings -> AI study helper -> pick Groq -> Connect. If it fails, the screen already tells the
   student to try Gemini. I made Gemini the preselected one for that reason. Gemini's free plan and browser access are
   also unconfirmed until you try a real key.
2. **Real keys not tested** (I have none). Everything below was tested against fake provider servers.
3. **Visual styling not checked.** My test setup has no Tailwind, so I tested behaviour, not looks. Look at the setup card, the
   onboarding step and the Settings page in light and dark, and at phone width.
4. **Onboarding.tsx edits were written against the older code dump.** If `--dry` complains, use `--manual`.
5. The default model names in `PROVIDERS` are only a fallback if the service's model list can't be fetched.
6. Gemini's free plan may use questions to improve Google products; the screen says so. Some of these services only allow
   adults to create accounts; the screen tells under-18 students to ask a parent or teacher.

## About "use an existing UI library"
I built this from native HTML plus your existing `Button`, with Tailwind, and added no packages, because the repo's rule is
"prefer no new dependencies" and I can't install or test packages in my environment. If the team does want a component
library, shadcn/ui is the usual choice with Tailwind 4 (it copies Radix-based components into the repo). The parts here that
map straight onto it: the provider cards -> RadioGroup, the "Advanced" box -> Collapsible, the status lines -> Alert,
the key box -> Input. That adds Radix, class-variance-authority, clsx and tailwind-merge as dependencies, so it needs a team
yes first. Prompt for your coding agent, if approved:

    Replace the hand-built radio cards, <details> "Advanced" box and status lines in src/components/AiConnect.tsx and
    AiOnboardingStep.tsx with shadcn/ui RadioGroup, Collapsible, Alert and Input (run `npx shadcn@latest init`, then add only
    those four). Keep behaviour identical: tests/ai-connect.test.ts must still pass, Enter inside the form must not bubble
    to the onboarding screen, and the key must never be shown after connecting.

## Tested here
- 15 new logic tests (Groq requests, streaming and errors; automatic model choice for all four services; key checks; the Connect
  flow; model repair; the Groq-unreachable message). The 16 earlier AI tests still pass, 31 in total.
- 32 browser checks (Chromium) on the Settings card, the onboarding step and the AI button, including hydration without
  warnings, Enter not leaking to the surrounding screen (with a control run proving the check can fail), a retired model
  being repaired with exactly one retry, and the key never staying in the page.
- Strict type check against stand-in React types.
