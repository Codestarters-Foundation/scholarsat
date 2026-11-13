# ScholarSAT

Free, open-source SAT prep: thousands of practice questions with explanations, adaptive full-length mock tests, progress tracking, mistake review, and vocabulary flashcards. No paywalls, ever.

**Live:** https://scholarsat.com

## Features

- **Question bank**: original Math and Reading & Writing questions covering every domain and skill on the digital SAT, filterable by skill, difficulty, and your history (unanswered / missed / saved)
- **Adaptive mock tests**: 4 timed modules (27/27 R&W, 22/22 Math). Module 2 adapts to module 1, with an estimated 400–1600 score report and answer review.
- **Dashboard**: predicted score, accuracy by domain, streaks, weakest skills, daily questions
- **Review**: every missed question is saved for retry, plus bookmarks
- **Vocabulary** flashcards with progress
- Math rendered with KaTeX; SPR answers accept any equivalent form (`1/2`, `.5`, `0.5`)

## Questions are original

Every question is written or generated for ScholarSAT. Math questions are generated from templates in [`scripts/gen-math.ts`](scripts/gen-math.ts): parameters are random, and **answers are computed, never hand-typed**. Reading & Writing content lives in [`scripts/rw-conventions.ts`](scripts/rw-conventions.ts) and [`scripts/rw-reading.ts`](scripts/rw-reading.ts). The bank is built into `src/data/questions.json` by `npm run bank` (runs automatically before `npm run build`).

SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this project.

**Contributing questions:** add frames or passages to the files above (or a new Math template), run `npm run bank`, and open a PR.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · SQLite (better-sqlite3) · KaTeX · Docker + Caddy

## Develop

```bash
npm install
npm run dev        # builds the question bank, then http://localhost:3000
```

Data is stored in `./data/scholarsat.db` (override with `DATA_DIR`).

## Deploy (single VPS)

1. Point an A record for your domain at the server.
2. One-time server setup (as root, after adding your SSH key):
   ```bash
   ssh root@HOST 'bash -s' < deploy/setup-server.sh
   ```
   Creates a `deploy` user, enables UFW (22/80/443) and fail2ban, installs Docker, and clones the repo to `/opt/scholarsat`.
3. On the server: `cp .env.example .env` and edit it.
4. `./deploy/deploy.sh`. Caddy obtains HTTPS certificates automatically.
5. After confirming key login works: `ssh root@HOST 'bash -s' < deploy/harden-ssh.sh` disables password login.

**Redeploy:** push to `main` (GitHub Actions deploys when the `DEPLOY_ENABLED` variable and `DEPLOY_SSH_KEY` / `DEPLOY_HOST` / `DEPLOY_KNOWN_HOSTS` secrets are set), or run `ssh deploy@HOST /opt/scholarsat/deploy/deploy.sh`.

**Logs:** `cd /opt/scholarsat && docker compose logs -f app` (or `caddy`).

**Backups:** the SQLite database lives in the `scholarsat_appdata` Docker volume.

## License

MIT
