# Kitchen Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface individual "Kitchen" throwaway projects on a `/projects/kitchen` page, each showing per-platform build status, editable from a local CLI and reflected without a redeploy.

**Architecture:** A new `kitchen_projects` table in the existing Turso DB is the single source of truth. A local Node CLI (`scripts/kitchen.mjs`) upserts rows. The `/projects/kitchen` page is the only on-demand-rendered route (`prerender = false`); it reads Turso at request time, so a status change appears on the next page load.

**Tech Stack:** Astro 6 (Vercel adapter), TypeScript, Tailwind v4, `@libsql/client` (Turso), Node's built-in `node:test` runner (no new dependency).

## Global Constraints

Copy these values verbatim everywhere they appear:

- **Platform keys:** `android`, `ios`, `react_native` (exactly these strings, in this display order).
- **Platform labels:** `Android`, `iOS`, `React Native`.
- **Status values:** `building` (displays as "Under Construction") and `done` (displays as "Done"). No other status exists.
- **CLI flag → platform key:** `--android`→`android`, `--ios`→`ios`, `--rn`→`react_native`; URL flags `--android-url`/`--ios-url`/`--rn-url` set the matching key's `url`.
- **Import alias:** `_/*` maps to `src/*` (e.g. `_/lib/kitchen`, `_/turso`).
- **Reuse existing helpers:** `padNumber` and `constructPageTitle` from `_/utils/misc`; never re-implement them.
- **Status badge palette (copied from `src/components/ProjectRow.astro`):** `done` → `bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-400`; `building` → `bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-400`.
- **Only `/projects/kitchen` is `prerender = false`.** The rest of the site stays static. No `output:` change in `astro.config.mjs` is needed — an adapter is already configured, so per-route opt-in works.
- **Testing reality:** This codebase has no component/integration test harness. Pure CLI logic is unit-tested with `node:test` (Task 1). Astro components/pages are verified via `pnpm typecheck` (astro check) + a dev/build smoke test — do not scaffold a new test framework for them (YAGNI).
- **Before every commit:** run `pnpm format`, `pnpm lint`, and `pnpm typecheck`; all must pass.

---

### Task 1: Kitchen CLI — pure logic with unit tests

Pure, dependency-free functions for argument parsing and value-building, fully unit-tested. The Turso wiring comes in Task 2.

**Files:**
- Create: `scripts/kitchen.mjs` (pure exports + table SQL; `main()` wiring added in Task 2)
- Create: `scripts/kitchen.test.mjs`
- Modify: `package.json` (add a `test` script)

**Interfaces:**
- Produces:
  - `CREATE_TABLE_SQL: string`
  - `parseArgs(argv: string[]) => { command: 'list' } | { command: 'rm', slug } | { command: 'set', slug, fields: { title?, summary?, tags?: string[] }, platforms: Record<platformKey, { status?, url? }> }`
  - `mergePlatforms(existing: object, patches: object) => object`
  - `buildSetValues(existing: {title,summary,tags:string[],platforms:object} | null, parsed, now: number) => { slug, title, summary, tags: string (JSON), platforms: string (JSON), updated_at: number }`

- [ ] **Step 1: Write the failing tests**

Create `scripts/kitchen.test.mjs`:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildSetValues, mergePlatforms, parseArgs } from './kitchen.mjs';

test('parseArgs: set with metadata and a platform', () => {
  const parsed = parseArgs([
    'set', 'film-nest',
    '--title', 'Film Nest',
    '--summary', 'Browse movies',
    '--tags', 'Kotlin, Compose',
    '--android', 'done',
    '--android-url', 'https://x',
  ]);
  assert.equal(parsed.command, 'set');
  assert.equal(parsed.slug, 'film-nest');
  assert.equal(parsed.fields.title, 'Film Nest');
  assert.deepEqual(parsed.fields.tags, ['Kotlin', 'Compose']);
  assert.deepEqual(parsed.platforms.android, { status: 'done', url: 'https://x' });
});

test('parseArgs: rejects an invalid status', () => {
  assert.throws(() => parseArgs(['set', 'film-nest', '--android', 'wip']), /must be "building" or "done"/);
});

test('parseArgs: --rn maps to react_native', () => {
  const parsed = parseArgs(['set', 'foo', '--rn', 'building']);
  assert.deepEqual(parsed.platforms.react_native, { status: 'building' });
});

test('parseArgs: list and rm', () => {
  assert.deepEqual(parseArgs(['list']), { command: 'list' });
  assert.deepEqual(parseArgs(['rm', 'foo']), { command: 'rm', slug: 'foo' });
});

test('mergePlatforms: adds a new platform with status', () => {
  assert.deepEqual(mergePlatforms({}, { ios: { status: 'building' } }), { ios: { status: 'building' } });
});

test('mergePlatforms: merges url into existing platform, keeps others', () => {
  const merged = mergePlatforms(
    { android: { status: 'done' }, ios: { status: 'building' } },
    { ios: { url: 'https://y' } },
  );
  assert.deepEqual(merged.android, { status: 'done' });
  assert.deepEqual(merged.ios, { status: 'building', url: 'https://y' });
});

test('mergePlatforms: throws when a new platform has a url but no status', () => {
  assert.throws(() => mergePlatforms({}, { ios: { url: 'https://y' } }), /needs a status/);
});

test('buildSetValues: a new project requires title and summary', () => {
  assert.throws(() => buildSetValues(null, { slug: 'x', fields: {}, platforms: {} }, 1), /requires --title and --summary/);
});

test('buildSetValues: patches existing fields and bumps updated_at', () => {
  const existing = { title: 'Film Nest', summary: 'old', tags: ['Kotlin'], platforms: { android: { status: 'building' } } };
  const parsed = { slug: 'film-nest', fields: {}, platforms: { android: { status: 'done' } } };
  const values = buildSetValues(existing, parsed, 12345);
  assert.equal(values.title, 'Film Nest');
  assert.equal(values.updated_at, 12345);
  assert.deepEqual(JSON.parse(values.platforms), { android: { status: 'done' } });
  assert.deepEqual(JSON.parse(values.tags), ['Kotlin']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/kitchen.test.mjs`
Expected: FAIL — `Cannot find module './kitchen.mjs'` (or named exports undefined).

- [ ] **Step 3: Implement the pure logic**

Create `scripts/kitchen.mjs`:

```js
import { createClient } from '@libsql/client/web';

export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS kitchen_projects (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]',
  platforms   TEXT NOT NULL DEFAULT '{}',
  updated_at  INTEGER NOT NULL
);`;

const STATUSES = new Set(['building', 'done']);
const PLATFORM_STATUS_FLAGS = { android: 'android', ios: 'ios', rn: 'react_native' };
const PLATFORM_URL_FLAGS = { 'android-url': 'android', 'ios-url': 'ios', 'rn-url': 'react_native' };

const flagFor = (key) => (key === 'react_native' ? 'rn' : key);

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!['set', 'list', 'rm'].includes(command)) {
    throw new Error(`Unknown command "${command ?? ''}". Use: set | list | rm`);
  }
  if (command === 'list') return { command };

  const slug = rest[0];
  if (!slug || slug.startsWith('--')) throw new Error(`${command} requires a <slug>`);
  if (command === 'rm') return { command, slug };

  const fields = {};
  const platforms = {};
  const flags = rest.slice(1);

  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    if (!flag.startsWith('--')) throw new Error(`Unexpected argument "${flag}"`);
    const name = flag.slice(2);
    const value = flags[++i];
    if (value === undefined || value.startsWith('--')) throw new Error(`Flag "${flag}" needs a value`);

    if (name === 'title') fields.title = value;
    else if (name === 'summary') fields.summary = value;
    else if (name === 'tags') fields.tags = value.split(',').map((t) => t.trim()).filter(Boolean);
    else if (PLATFORM_STATUS_FLAGS[name]) {
      if (!STATUSES.has(value)) throw new Error(`Status for --${name} must be "building" or "done" (got "${value}")`);
      const key = PLATFORM_STATUS_FLAGS[name];
      platforms[key] = { ...platforms[key], status: value };
    } else if (PLATFORM_URL_FLAGS[name]) {
      const key = PLATFORM_URL_FLAGS[name];
      platforms[key] = { ...platforms[key], url: value };
    } else throw new Error(`Unknown flag "${flag}"`);
  }

  return { command, slug, fields, platforms };
}

export function mergePlatforms(existing, patches) {
  const merged = { ...existing };
  for (const [key, patch] of Object.entries(patches)) {
    const current = existing[key];
    const status = patch.status ?? current?.status;
    if (!status) throw new Error(`Platform "${key}" needs a status the first time you add it (e.g. --${flagFor(key)} building)`);
    const url = patch.url ?? current?.url;
    merged[key] = url ? { status, url } : { status };
  }
  return merged;
}

export function buildSetValues(existing, parsed, now) {
  if (!existing && (!parsed.fields.title || !parsed.fields.summary)) {
    throw new Error(`New project "${parsed.slug}" requires --title and --summary`);
  }
  const title = parsed.fields.title ?? existing.title;
  const summary = parsed.fields.summary ?? existing.summary;
  const tags = parsed.fields.tags ?? existing?.tags ?? [];
  const platforms = mergePlatforms(existing?.platforms ?? {}, parsed.platforms);
  return {
    slug: parsed.slug,
    title,
    summary,
    tags: JSON.stringify(tags),
    platforms: JSON.stringify(platforms),
    updated_at: now,
  };
}
```

> Note: the `createClient` import is unused until Task 2 wires `main()`. Biome may warn on the unused import; leave it — Task 2 consumes it in the same file. If lint blocks the commit, move this import into Task 2's edit instead.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/kitchen.test.mjs`
Expected: PASS — all 9 tests pass.

- [ ] **Step 5: Add the `test` script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "node --test",
```

- [ ] **Step 6: Commit**

```bash
git add scripts/kitchen.mjs scripts/kitchen.test.mjs package.json
git commit -m "feat(kitchen): add CLI pure logic with unit tests"
```

---

### Task 2: Kitchen CLI — Turso wiring and package scripts

Wire the pure logic to Turso: provision the table, dispatch `set`/`list`/`rm`, and add the `pnpm kitchen:*` scripts.

**Files:**
- Modify: `scripts/kitchen.mjs` (append `loadExisting`, `main()`, and the main-guard)
- Modify: `package.json` (add `kitchen:set`, `kitchen:list`, `kitchen:rm`)

**Interfaces:**
- Consumes (from Task 1): `CREATE_TABLE_SQL`, `parseArgs`, `buildSetValues`.

- [ ] **Step 1: Append the runtime wiring to `scripts/kitchen.mjs`**

Add at the end of the file:

```js
async function loadExisting(client, slug) {
  const { rows } = await client.execute({ sql: 'SELECT * FROM kitchen_projects WHERE slug = ?', args: [slug] });
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    tags: JSON.parse(String(row.tags ?? '[]')),
    platforms: JSON.parse(String(row.platforms ?? '{}')),
  };
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are not set. Add them to .env');
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  await client.execute(CREATE_TABLE_SQL);

  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.command === 'list') {
    const { rows } = await client.execute('SELECT slug, title, platforms, updated_at FROM kitchen_projects ORDER BY updated_at DESC');
    if (rows.length === 0) {
      console.log('No kitchen projects yet.');
      return;
    }
    for (const row of rows) {
      const platforms = JSON.parse(String(row.platforms ?? '{}'));
      const summary = Object.entries(platforms).map(([k, v]) => `${k}:${v.status}`).join(', ') || '(no platforms)';
      console.log(`${String(row.slug).padEnd(24)} ${String(row.title).padEnd(24)} ${summary}`);
    }
    return;
  }

  if (parsed.command === 'rm') {
    await client.execute({ sql: 'DELETE FROM kitchen_projects WHERE slug = ?', args: [parsed.slug] });
    console.log(`Removed "${parsed.slug}".`);
    return;
  }

  const existing = await loadExisting(client, parsed.slug);
  const values = buildSetValues(existing, parsed, Date.now());
  await client.execute({
    sql: `INSERT INTO kitchen_projects (slug, title, summary, tags, platforms, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            title=excluded.title, summary=excluded.summary, tags=excluded.tags,
            platforms=excluded.platforms, updated_at=excluded.updated_at`,
    args: [values.slug, values.title, values.summary, values.tags, values.platforms, values.updated_at],
  });
  console.log(`Saved "${parsed.slug}".`);
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Add the `kitchen:*` scripts to `package.json`**

In the `"scripts"` block, add:

```json
"kitchen:set": "node --env-file=.env scripts/kitchen.mjs set",
"kitchen:list": "node --env-file=.env scripts/kitchen.mjs list",
"kitchen:rm": "node --env-file=.env scripts/kitchen.mjs rm",
```

- [ ] **Step 3: Re-run the unit tests (wiring must not break pure logic)**

Run: `node --test scripts/kitchen.test.mjs`
Expected: PASS — all 9 tests still pass (the main-guard prevents `main()` from running under the test importer).

- [ ] **Step 4: Smoke-test against Turso (requires `.env` with TURSO_*), seeding real data**

```bash
pnpm kitchen:set film-nest \
  --title "Film Nest" \
  --summary "A minimalist app to browse The Movie Database's top movies and shows" \
  --tags "Kotlin,Jetpack Compose,SwiftUI" \
  --android done --android-url "https://github.com/cross19xx/Kitchen-Android/tree/main/film-nest-android" \
  --ios building --ios-url "https://github.com/cross19xx/Kitchen-iOS/tree/main/film-nest-ios"
pnpm kitchen:list
```

Expected: `Saved "film-nest".`, then `kitchen:list` prints a row like
`film-nest                Film Nest                android:done, ios:building`.
(Adjust statuses to reflect reality; this row is also used to verify the page in Task 5.)

- [ ] **Step 5: Commit**

```bash
git add scripts/kitchen.mjs package.json
git commit -m "feat(kitchen): wire CLI to Turso and add pnpm scripts"
```

---

### Task 3: Site domain module (`src/lib/kitchen.ts`)

Typed model + display config + a tolerant row parser shared by the page and the card.

**Files:**
- Create: `src/lib/kitchen.ts`

**Interfaces:**
- Produces:
  - `type KitchenStatus = 'building' | 'done'`
  - `type KitchenPlatformKey = 'android' | 'ios' | 'react_native'`
  - `interface KitchenPlatformInfo { status: KitchenStatus; url?: string }`
  - `interface KitchenProject { slug: string; title: string; summary: string; tags: string[]; platforms: Partial<Record<KitchenPlatformKey, KitchenPlatformInfo>>; updatedAt: number }`
  - `const KITCHEN_PLATFORMS: { key: KitchenPlatformKey; label: string }[]`
  - `const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string>`
  - `parseKitchenRow(row: Record<string, unknown>): KitchenProject`

- [ ] **Step 1: Create the module**

Create `src/lib/kitchen.ts`:

```ts
export type KitchenStatus = 'building' | 'done';

export type KitchenPlatformKey = 'android' | 'ios' | 'react_native';

export interface KitchenPlatformInfo {
  status: KitchenStatus;
  url?: string;
}

export interface KitchenProject {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  platforms: Partial<Record<KitchenPlatformKey, KitchenPlatformInfo>>;
  updatedAt: number;
}

/** Fixed display order and labels. Platforms render in this order; absent ones are skipped. */
export const KITCHEN_PLATFORMS: { key: KitchenPlatformKey; label: string }[] = [
  { key: 'android', label: 'Android' },
  { key: 'ios', label: 'iOS' },
  { key: 'react_native', label: 'React Native' },
];

export const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string> = {
  building: 'Under Construction',
  done: 'Done',
};

/** Convert a raw Turso row into a typed project, tolerating malformed JSON. */
export function parseKitchenRow(row: Record<string, unknown>): KitchenProject {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(String(row.tags ?? '[]'));
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    tags = [];
  }

  let platforms: KitchenProject['platforms'] = {};
  try {
    const parsed = JSON.parse(String(row.platforms ?? '{}'));
    if (parsed && typeof parsed === 'object') platforms = parsed as KitchenProject['platforms'];
  } catch {
    platforms = {};
  }

  return {
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    tags,
    platforms,
    updatedAt: Number(row.updated_at ?? 0),
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS — no new errors. (The module isn't imported yet; this confirms it's self-consistent.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/kitchen.ts
git commit -m "feat(kitchen): add typed model and row parser"
```

---

### Task 4: `KitchenCard.astro` component

One list item per project: title, summary, unioned tags, and a per-platform badge row (linked when a URL exists).

**Files:**
- Create: `src/components/KitchenCard.astro`

**Interfaces:**
- Consumes (Task 3): `KitchenProject`, `KitchenStatus`, `KITCHEN_PLATFORMS`, `KITCHEN_STATUS_LABEL`; `padNumber` from `_/utils/misc`.

- [ ] **Step 1: Create the component**

Create `src/components/KitchenCard.astro`:

```astro
---
import { KITCHEN_PLATFORMS, KITCHEN_STATUS_LABEL } from '_/lib/kitchen';
import type { KitchenProject, KitchenStatus } from '_/lib/kitchen';
import { padNumber } from '_/utils/misc';

interface Props {
  project: KitchenProject;
  index: number;
  class?: string;
}

const { project, index, class: className } = Astro.props;

const statusBadge: Record<KitchenStatus, string> = {
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-400',
  building: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-400',
};

const presentPlatforms = KITCHEN_PLATFORMS.filter((p) => project.platforms[p.key]);
---

<li class:list={['reveal flex gap-5 py-8', className]}>
  <span class="text-caption-foreground font-mono text-sm">{padNumber(index + 1)}</span>
  <div class="flex-1">
    <h3 class="text-base font-medium">{project.title}</h3>

    <p class="text-muted-foreground mt-1.5 max-w-[60ch] text-base text-pretty">{project.summary}</p>

    {
      project.tags.length > 0 && (
        <p class="text-caption-foreground mt-3 font-mono text-xs tracking-wide uppercase">
          {project.tags.join('  ·  ')}
        </p>
      )
    }

    <div class="mt-4 flex flex-wrap gap-2">
      {
        presentPlatforms.map((p) => {
          const info = project.platforms[p.key]!;
          const label = `${p.label} · ${KITCHEN_STATUS_LABEL[info.status]}`;
          const badgeClass = `rounded-sm px-2.5 py-0.5 text-xs font-medium ${statusBadge[info.status]}`;
          return info.url ? (
            <a href={info.url} class:list={[badgeClass, 'hover:underline']}>
              {label}
            </a>
          ) : (
            <span class={badgeClass}>{label}</span>
          );
        })
      }
    </div>
  </div>
</li>
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS — no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/KitchenCard.astro
git commit -m "feat(kitchen): add KitchenCard component"
```

---

### Task 5: `/projects/kitchen` page + runtime Turso env

The on-demand page that reads Turso at request time, plus the one-line `turso.ts` change that lets the client read env at runtime.

**Files:**
- Modify: `src/turso.ts`
- Create: `src/pages/projects/kitchen.astro`
- Modify: `src/data/pages.ts` (add the `PAGE_META['/projects/kitchen']` entry — needed for the page's title/description and OG card)

**Interfaces:**
- Consumes: `turso` (`_/turso`); `parseKitchenRow`, `KitchenProject` (`_/lib/kitchen`); `KitchenCard.astro`; `PageIntro.astro`, `BaseLayout`, `constructPageTitle`, `PAGE_META`.

- [ ] **Step 1: Make `turso.ts` read env at runtime**

Replace the body of `src/turso.ts`:

```ts
import { createClient } from '@libsql/client/web';

// `import.meta.env` is populated at build time (content-collection loaders);
// `process.env` is populated at request time on Vercel (the on-demand
// /projects/kitchen route). The fallback covers both contexts.
const url = (import.meta.env.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL) as string;
const authToken = (import.meta.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN) as string;

export const turso = createClient({ url, authToken });
```

- [ ] **Step 2: Add the PAGE_META entry**

In `src/data/pages.ts`, add inside the `PAGE_META` object (e.g. right after the `'/projects'` entry):

```ts
  '/projects/kitchen': {
    title: 'Kitchen',
    description: 'Throwaway native Android, iOS, and React Native projects for staying sharp.',
  },
```

- [ ] **Step 3: Create the page**

Create `src/pages/projects/kitchen.astro`:

```astro
---
import { ArrowLeftIcon } from '@lucide/astro';

import KitchenCard from '_/components/KitchenCard.astro';
import PageIntro from '_/components/PageIntro.astro';
import { PAGE_META } from '_/data/pages';
import BaseLayout from '_/layouts/Base.astro';
import type { KitchenProject } from '_/lib/kitchen';
import { parseKitchenRow } from '_/lib/kitchen';
import { turso } from '_/turso';
import { constructPageTitle } from '_/utils/misc';

export const prerender = false;

let projects: KitchenProject[] = [];
try {
  const { rows } = await turso.execute('SELECT * FROM kitchen_projects ORDER BY updated_at DESC');
  projects = rows.map((row) => parseKitchenRow(row as unknown as Record<string, unknown>));
} catch (error) {
  console.error('Failed to load kitchen projects:', error);
  projects = [];
}

const shipped = projects.filter((p) => {
  const entries = Object.values(p.platforms);
  return entries.length > 0 && entries.every((info) => info?.status === 'done');
}).length;

const eyebrow = `Kitchen — ${projects.length} experiment${projects.length === 1 ? '' : 's'}, ${shipped} shipped`;
const { title, description } = PAGE_META['/projects/kitchen'];
---

<BaseLayout title={constructPageTitle(title)} description={description}>
  <PageIntro
    eyebrow={eyebrow}
    title="Kitchen"
    description="Throwaway projects for staying sharp across native Android, iOS, and React Native — each in its own state of done.">
    <p slot="page-link" class="mb-4">
      <a
        href="/projects"
        class="reveal text-foreground/80 hover:text-foreground inline-flex items-center gap-2 font-mono text-sm">
        <ArrowLeftIcon class="size-3" /> All Projects
      </a>
    </p>
  </PageIntro>

  <div class="border-border border-t py-12 sm:py-16">
    <div class="mx-auto max-w-5xl px-6 lg:px-8">
      {
        projects.length === 0 ? (
          <p class="text-muted-foreground">No experiments yet — check back soon.</p>
        ) : (
          <ul role="list" class="divide-border divide-y">
            {projects.map((project, i) => (
              <KitchenCard project={project} index={i} class="py-10" />
            ))}
          </ul>
        )
      }
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS — no new errors.

- [ ] **Step 5: Smoke-test in dev (uses the row seeded in Task 2)**

Run: `pnpm dev`, then open `http://localhost:4321/projects/kitchen`.
Expected: a "Kitchen" page with the eyebrow `Kitchen — 1 experiment, 0 shipped`, one card titled "Film Nest" with tags and two badges — `Android · Done` (emerald, links to the Android folder) and `iOS · Under Construction` (amber, links to the iOS folder). Click each badge to confirm it opens the correct GitHub folder.

- [ ] **Step 6: Build to confirm the route is server-rendered and OG card generates**

Run: `pnpm build`
Expected: PASS. The build log shows `/projects/kitchen` as an on-demand/server route (not prerendered), and `og/projects/kitchen.png` among generated pages.

- [ ] **Step 7: Commit**

```bash
git add src/turso.ts src/data/pages.ts src/pages/projects/kitchen.astro
git commit -m "feat(kitchen): add on-demand /projects/kitchen page"
```

---

### Task 6: Link the existing Projects entry to the new page

Point the `/projects` "Kitchen" row at the new sub-page instead of the GitHub repo.

**Files:**
- Modify: `src/data/projects.ts`

- [ ] **Step 1: Update the Kitchen entry's link**

In `src/data/projects.ts`, change the `Kitchen` object's `link` field:

```ts
    link: '/projects/kitchen',
```

(from `'https://www.github.com/cross19xx/Kitchen-Android'`). Leave all other fields unchanged.

- [ ] **Step 2: Typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS.

- [ ] **Step 3: Smoke-test the link**

Run: `pnpm dev`, open `http://localhost:4321/projects`, click the "Kitchen" row.
Expected: navigates to `/projects/kitchen` (internal route), not GitHub.

- [ ] **Step 4: Commit**

```bash
git add src/data/projects.ts
git commit -m "feat(kitchen): link Projects entry to /projects/kitchen"
```

---

## Self-Review

**Spec coverage:**
- Naming convention / slug → platform & URL: stored directly per spec; CLI accepts platform+URL flags (Tasks 1–2). ✓
- Status signal (building/done) without rebuild: Turso table + on-demand page (`prerender = false`) reading at request time (Tasks 2, 5). ✓
- Surface projects at `/projects/kitchen`, one card per project, grouped by base name with per-platform badges + direct GitHub links (Tasks 4, 5). ✓
- Manual CLI, website-side source of truth, no Kitchen-repo files (Tasks 1, 2). ✓
- JSON `platforms` column (Tasks 1, 3). ✓
- Touch points: `projects.ts` link, `pages.ts` PAGE_META, `turso.ts` runtime env (Tasks 5, 6). ✓
- Out of scope respected: no detail pages, no README parsing, no CI, no write endpoint. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code; every test step shows commands + expected output.

**Type consistency:** `KitchenProject`/`KitchenPlatformKey`/`KitchenStatus` are defined in Task 3 and consumed identically in Tasks 4–5. CLI platform keys (`android`/`ios`/`react_native`) and statuses (`building`/`done`) match the site model and the Global Constraints. `parseKitchenRow` signature matches its call site. `padNumber(index + 1)` matches the existing `ProjectRow` usage.
