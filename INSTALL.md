# Missed-question loop

Suggested branch: `feat/missed-question-loop`

Missed questions come back after 1, 3 and 7 days. A right answer when one is due moves it up a step, three in a row and it
graduates, and any miss starts it over. After a wrong answer, signed-in students can tap why (Misread it, Careless slip, Rushed,
Didn't know it). A new **Due today** page shows what to review and a "why you miss" breakdown.

It uses the attempts you already store. The only new thing in the database is a small `miss_reasons` table, which creates itself the first
time it is used, so `db.ts` does not change. Students who are signed out see no change.

## Do this on GitHub (no terminal)
Make a new branch from a green main first, then:

**A. Add these new files** (Add file, then Upload files; dragging the `src` and `tests` folders from this zip keeps the paths):
- `src/lib/miss-reasons.ts`
- `src/lib/missed-loop.ts`
- `src/lib/miss-store.ts`
- `src/app/api/miss-reason/route.ts`
- `src/components/MissReason.tsx`
- `src/components/DueTodayCard.tsx`
- `src/app/(app)/review/today/page.tsx`
- `tests/missed-loop.test.ts`
- `tests/miss-store.test.ts`

**B. Replace this file with the version in the zip:** `src/components/tutor/TeachButton.tsx`

**C. Three small edits** (open the file, click the pencil):

1. `src/components/PracticePlayer.tsx`: find
   ```tsx
   <TeachButton qid={q.id} />
   ```
   and change it to
   ```tsx
   <TeachButton qid={q.id} correct={result.correct} saved={result.saved} />
   ```

2. `src/app/(app)/review/page.tsx`: add this line with the other imports at the top
   ```tsx
   import { DueTodayCard } from "@/components/DueTodayCard";
   ```
   then find the line `<div className="grid gap-6 lg:grid-cols-2">` and put this on the line just above it
   ```tsx
   <DueTodayCard />
   ```

3. `package.json`: in the `"test:logic"` line, add ` tests/missed-loop.test.ts tests/miss-store.test.ts` just before the closing quote of that line.

Commit to the branch, open a pull request, and wait for CI to go green before merging.

## What I tested
- 18 logic and database tests (the ladder, early and late answers, resets, graduation, ordering, reasons, 60-day window, one student only,
  deleted attempts). I broke the code on purpose five ways and the tests caught each one.
- 10 browser tests of the chips: they show only after a wrong answer from a signed-in student; tapping saves and tapping again clears; a
  failed save (401, 500, dropped connection) puts the chip back and says so; an old request that fails late cannot undo a newer tap;
  Enter, Space and the arrow keys on a chip do not check, advance or go back; phone width does not scroll sideways; light and dark. Four
  deliberate breakages were caught.
- The 20 earlier tutor browser tests still pass.
- Strict TypeScript is clean for all new files against stand-ins for your app modules.

## What I could not check
- I could not open your live `review/page.tsx`, `PracticePlayer.tsx` or `ui.tsx`, so the three edits use lines I know from earlier versions, and the
  new page uses the `PageTitle`, `HeaderCard`, `LinkButton`, `EmptyState` and `DiffBadge` components as they were in those versions.
  If CI reports a type error in `review/today/page.tsx`, paste it and I will fix it.
- The database code ran against SQLite here (Node's built-in one), not `better-sqlite3`. The test uses `better-sqlite3` automatically in CI.
- The Due today page itself was not rendered in a browser here; the chips were.
- Signed-out students get no loop (it needs an account). Say so if you want an on-device version.
