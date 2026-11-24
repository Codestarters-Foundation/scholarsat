Paste this into Claude Code opened in the scholarsat repo, on branch `feat/more-reading-qs-ui-sweep`.

---
1. Install the skill: `npx -y skills add emilkowalski/skills --skill emil-design-eng -y`, then follow it for every UI change below.

2. Full UI sweep. Run `npm run dev` and look at every route in (app) plus /daily, /login and /onboarding, signed in, at 375px, 768px and 1280px wide, in light AND dark theme (use Playwright screenshots). Fix what is off, page by page, one commit per page. Start with /review: in dark mode the HeaderCard strips ("Missed questions", "Saved questions") show no colored fill, and the title sits flush against the card's left edge with no padding. Find out why (tokens like bg-accent-fill / gold-fill missing in the dark theme? a px-5 override?) and fix it at the HeaderCard source so every page that uses it is fixed. Then check: left edges and gutters line up between PageTitle and cards, equal card heights/gaps in grids, empty states centered, icon and text baselines, truncation instead of overflow, tap targets >= 40px, focus rings, and no horizontal scroll at 375px. Apply Emil's rules for transitions (no animating layout, short eased transitions on hover/press only, respect prefers-reduced-motion).

3. Diagnostics is already built (see NOTES.md section 3: DailyAnswerCard, /api/daily/answer, daily-answer.ts). Include it in the sweep: check it at all widths in light and dark, and make sure its choices, tabs and result panel line up with the rest of the page.

4. Inspiration only from https://cooksat.com (public marketing page: predicted-score scale 1200-1600, 7-day practice streak row, stat tiles). Do not copy its code, copy, logos or branding.

5. Before finishing: `npm run typecheck && npm run lint && npm run build`. List every file changed and anything you could not verify.
