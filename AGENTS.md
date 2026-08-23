# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side single-page app (React 19 + TypeScript + Vite) for studying TOEIC/受験 vocabulary as phrase flashcards. There is no backend or database — all learning state persists to the browser's `localStorage`. There are no environment variables or secrets required.

### Services & commands

Standard scripts live in `package.json`; use them directly:

- Dev server: `npm run dev` — Vite serves at `http://localhost:5173/TOEIC-tango/`. Note the `/TOEIC-tango/` base path (set via `base` in `vite.config.ts`); the bare `http://localhost:5173/` root will not load the app.
- Tests: `npm test` (runs `vitest run`). Test files live alongside sources in `src/lib/*.test.ts`.
- Lint/typecheck: there is no separate lint script; type checking is `tsc --noEmit`, which also runs as the first step of `npm run build`.
- Build: `npm run build` runs `tsc --noEmit`, deletes `docs/`, runs `vite build`, then `scripts/postbuild.mjs`. Build output goes to `docs/` (committed, served by GitHub Pages), not `dist/`.

### Non-obvious notes

- `docs/` is a committed build artifact used for GitHub Pages deploy (`.github/workflows/deploy-pages.yml`). Running `npm run build` regenerates it; avoid committing incidental rebuild churn unless you intend to update the deployed site.
- The word dataset is `src/data/words.json` (1900 entries). `scripts/gen_target1900.py` and `scripts/target1900.tsv` are the generator inputs for that JSON and are not part of the runtime app.
- Since state is in `localStorage`, a fresh browser profile starts with the onboarding flow; clearing site data resets all progress.
