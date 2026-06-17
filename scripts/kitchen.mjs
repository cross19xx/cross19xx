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
    if (value === undefined || value.startsWith('--'))
      throw new Error(`Flag "${flag}" needs a value`);

    if (name === 'title') fields.title = value;
    else if (name === 'summary') fields.summary = value;
    else if (name === 'tags')
      fields.tags = value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    else if (PLATFORM_STATUS_FLAGS[name]) {
      if (!STATUSES.has(value))
        throw new Error(`Status for --${name} must be "building" or "done" (got "${value}")`);
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
    if (!status)
      throw new Error(
        `Platform "${key}" needs a status the first time you add it (e.g. --${flagFor(key)} building)`,
      );
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

async function loadExisting(client, slug) {
  const { rows } = await client.execute({
    sql: 'SELECT * FROM kitchen_projects WHERE slug = ?',
    args: [slug],
  });
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
    const { rows } = await client.execute(
      'SELECT slug, title, platforms, updated_at FROM kitchen_projects ORDER BY updated_at DESC',
    );
    if (rows.length === 0) {
      console.log('No kitchen projects yet.');
      return;
    }
    for (const row of rows) {
      const platforms = JSON.parse(String(row.platforms ?? '{}'));
      const summary =
        Object.entries(platforms)
          .map(([k, v]) => `${k}:${v.status}`)
          .join(', ') || '(no platforms)';
      console.log(`${String(row.slug).padEnd(24)} ${String(row.title).padEnd(24)} ${summary}`);
    }
    return;
  }

  if (parsed.command === 'rm') {
    await client.execute({
      sql: 'DELETE FROM kitchen_projects WHERE slug = ?',
      args: [parsed.slug],
    });
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
    args: [
      values.slug,
      values.title,
      values.summary,
      values.tags,
      values.platforms,
      values.updated_at,
    ],
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
