export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS kitchen_projects (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]',
  platforms   TEXT NOT NULL DEFAULT '{}',
  updated_at  INTEGER NOT NULL
);`;

const STATUSES = new Set(["building", "done"]);
const PLATFORM_STATUS_FLAGS = { android: "android", ios: "ios", rn: "react_native" };
const PLATFORM_URL_FLAGS = { "android-url": "android", "ios-url": "ios", "rn-url": "react_native" };

const flagFor = (key) => (key === "react_native" ? "rn" : key);

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!["set", "list", "rm"].includes(command)) {
    throw new Error(`Unknown command "${command ?? ""}". Use: set | list | rm`);
  }
  if (command === "list") return { command };

  const slug = rest[0];
  if (!slug || slug.startsWith("--")) throw new Error(`${command} requires a <slug>`);
  if (command === "rm") return { command, slug };

  const fields = {};
  const platforms = {};
  const flags = rest.slice(1);

  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    if (!flag.startsWith("--")) throw new Error(`Unexpected argument "${flag}"`);
    const name = flag.slice(2);
    const value = flags[++i];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`Flag "${flag}" needs a value`);

    if (name === "title") fields.title = value;
    else if (name === "summary") fields.summary = value;
    else if (name === "tags")
      fields.tags = value
        .split(",")
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
