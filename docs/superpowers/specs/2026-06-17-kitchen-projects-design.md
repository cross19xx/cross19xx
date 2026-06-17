# Kitchen Projects — Design

- **Date:** 2026-06-17
- **Author:** Kenneth Kwakye-Gyamfi
- **Status:** Approved (ready for implementation plan)

## Context

"Kitchen" is a collection of throwaway projects spread across platform repos
(`Kitchen-Android`, `Kitchen-iOS`, and a future React Native repo). Each project
is a top-level directory in its repo following the naming convention
`name-in-kebab-case-(android|ios)` — e.g. `film-nest-android`, `film-nest-ios`.

Today the website (an Astro 6 static site on Vercel) surfaces "Kitchen" as a single
hand-written entry in `src/data/projects.ts` that links straight to the Android repo.
We want to surface the individual Kitchen projects on their own page,
`/projects/kitchen`, and show each one's build status per platform.

## Goals

1. Surface individual Kitchen projects on `/projects/kitchen`, grouped one card per
   project (concept), with a per-platform status badge and a direct link to the code.
2. Let each project carry a status — **under construction** or **done** — per platform.
3. Reflect a status change **without rebuilding/redeploying** the site.
4. Keep the editing workflow simple (no CI in the Kitchen repos).

## Non-goals (YAGNI)

- No per-project detail pages on the website (link out to GitHub instead).
- No README parsing, screenshots, or media pulled from the repos.
- No GitHub Actions / CI in the Kitchen repos.
- No public write endpoint / auth — editing is local-only via a CLI.

## Decisions

These were settled during brainstorming:

| Decision | Choice | Rationale |
| --- | --- | --- |
| Storage | Existing **Turso** DB, new `kitchen_projects` table | Reuses the DB + `@libsql/client` already in the project. |
| Reflect changes without rebuild | `/projects/kitchen` is **on-demand rendered** (`prerender = false`) and queries Turso **at request time** | The album/photo build-time loader pattern requires a deploy-hook rebuild; the user explicitly does not want that for status changes. |
| How status gets into Turso | **Manual CLI** (`pnpm kitchen:set …`) run locally | Simplest; no CI in the Kitchen repos. |
| Metadata source | **Website-side only** (Turso / CLI). No metadata files in the Kitchen repos. | User maintains everything from the site side. |
| Grain | **One row per project** (base name), with a per-platform status + URL | Platform set is fixed (android, ios, react_native); a row-per-variant was excessive. |
| Platform data shape | **JSON `platforms` column** | Matches the existing `photos` table (which stores `tags`/`metadata` as JSON); keeps platforms open-ended. |
| Repo links | **Stored directly** in the row (per platform) | The site never parses the slug or guesses a repo path. |

The `-android` / `-ios` / react-native folder naming convention remains the user's
repo-organization rule. The website does **not** depend on parsing it — it uses the
GitHub URLs stored in Turso.

## Architecture / data flow

```
You (terminal)                   Turso DB                  Site (Vercel)
─────────────                    ────────                  ─────────────
pnpm kitchen:set ...  ──upsert──▶ kitchen_projects ──read at REQUEST time──▶ /projects/kitchen
                                                          (prerender = false)
```

- The `kitchen_projects` table is the single source of truth.
- `/projects/kitchen` is the only on-demand-rendered route; the rest of the site stays
  static. It queries Turso per request, so a `kitchen:set` shows up on the next page load.

## Turso schema — one row per project

```sql
CREATE TABLE IF NOT EXISTS kitchen_projects (
  slug        TEXT PRIMARY KEY,            -- base name: 'film-nest'
  title       TEXT NOT NULL,               -- 'Film Nest'
  summary     TEXT NOT NULL,               -- 'Browse IMDB's top 250 movies'
  tags        TEXT NOT NULL DEFAULT '[]',  -- JSON array: ["Kotlin","Jetpack Compose","SwiftUI"]
  platforms   TEXT NOT NULL DEFAULT '{}',  -- JSON, see below
  updated_at  INTEGER NOT NULL             -- unix ms, for ordering
);
```

`platforms` holds one entry per platform that exists, each with a `status` and a direct
GitHub URL. Absent platform = not built yet.

```json
{
  "android": { "status": "done",     "url": "https://github.com/cross19xx/Kitchen-Android/tree/main/film-nest-android" },
  "ios":     { "status": "building", "url": "https://github.com/cross19xx/Kitchen-iOS/tree/main/film-nest-ios" }
}
```

- `status` is one of `"building"` (Under Construction) or `"done"` (Done).
- Platform keys are drawn from the fixed set `android | ios | react_native`.

## CLI — `scripts/kitchen.mjs`

Run with Node's `--env-file=.env` (same approach as the existing `pnpm deploy` script),
so it reads `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from `.env`.

```
pnpm kitchen:set <slug> \
  [--title T] [--summary S] [--tags a,b,c] \
  [--android  building|done] [--android-url URL] \
  [--ios      building|done] [--ios-url URL] \
  [--rn       building|done] [--rn-url URL]

pnpm kitchen:list            # print the table
pnpm kitchen:rm <slug>       # remove a project
```

Behaviour:

- `set` is an **upsert with patch semantics**. The first call for a slug requires
  `--title` and `--summary`. Subsequent calls patch only the fields/flags provided
  (e.g. `pnpm kitchen:set film-nest --ios done` flips just the iOS status;
  `--android-url …` sets just that URL).
- Flag → platform-key mapping: `--android` → `android`, `--ios` → `ios`,
  `--rn` / `--rn-url` → `react_native`.
- Setting a platform status merges into the existing `platforms` JSON; it does not clobber
  other platforms.
- A platform's `url` is **optional**: a platform may have a `status` with no `url` (the badge
  renders without a link). `--<platform>-url` adds or updates the link independently of status.
- Every `set` bumps `updated_at`.
- The script runs `CREATE TABLE IF NOT EXISTS kitchen_projects (…)` on each invocation, so
  the first call provisions the table — no separate migration step.

`package.json` scripts: `kitchen:set`, `kitchen:list`, `kitchen:rm` (thin wrappers over
`node --env-file=.env scripts/kitchen.mjs <command>`).

## The `/projects/kitchen` page

- `export const prerender = false;` — on-demand rendered.
- Frontmatter: `SELECT * FROM kitchen_projects ORDER BY updated_at DESC`. One row = one card;
  no grouping step is needed.
- Reuses `BaseLayout` and `PageIntro`. Eyebrow e.g. *"Kitchen — N experiments, M shipped"*,
  with a back-link to `/projects` (mirrors the `albums/[id].astro` back-link pattern).
- New component `KitchenCard.astro`: renders title, summary, the unioned `tags`, and a
  per-platform badge row. It iterates the fixed platform order `[android, ios, react_native]`,
  rendering a badge only for platforms present in the row's `platforms` JSON. Each badge shows
  the platform label (`Android` / `iOS` / `React Native`) + status; when the platform has a
  `url`, the badge links to it, otherwise it renders as plain text.
- Status styling reuses the existing badge palette from `ProjectRow.astro`:
  `done` → emerald (like "Shipped"), `building` → amber (like "In Progress").

## Touch points in existing code

- **`src/data/projects.ts`** — change the **Kitchen** entry's `link` from the GitHub URL to
  `/projects/kitchen` (internal link; `ProjectRow.astro` already just renders `href`).
- **`src/data/pages.ts`** — add a `/projects/kitchen` entry to `PAGE_META` (title +
  description; feeds the `<title>` and OG card generation).
- **`src/turso.ts`** — ensure the client reads its env **at runtime** for the server route.
  This is the first non-build-time DB read; today `turso.ts` uses `import.meta.env`, which is
  resolved at build. The server route must read runtime env (via `astro:env/server` or
  `process.env`). Build-time loaders (albums/photos) must keep working.

## Runtime / env considerations

- On-demand routes run on Vercel's Node runtime via `@astrojs/vercel`. Confirm the Turso
  client used by the page reads `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` at runtime and that
  both are present in the Vercel project's environment variables (not only local `.env`).
- Per-request DB reads are fine for a low-traffic personal site. An optional short
  `Cache-Control: s-maxage=…, stale-while-revalidate` header could be added later to cache at
  the edge; omitted for now so status changes appear immediately.

## Open questions

None outstanding — all brainstorming decisions are resolved.
