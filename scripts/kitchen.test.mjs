import assert from "node:assert/strict";
import { test } from "node:test";

import { buildSetValues, mergePlatforms, parseArgs } from "./kitchen.mjs";

test("parseArgs: set with metadata and a platform", () => {
  const parsed = parseArgs([
    "set",
    "film-nest",
    "--title",
    "Film Nest",
    "--summary",
    "Browse movies",
    "--tags",
    "Kotlin, Compose",
    "--android",
    "done",
    "--android-url",
    "https://x",
  ]);
  assert.equal(parsed.command, "set");
  assert.equal(parsed.slug, "film-nest");
  assert.equal(parsed.fields.title, "Film Nest");
  assert.deepEqual(parsed.fields.tags, ["Kotlin", "Compose"]);
  assert.deepEqual(parsed.platforms.android, { status: "done", url: "https://x" });
});

test("parseArgs: rejects an invalid status", () => {
  assert.throws(
    () => parseArgs(["set", "film-nest", "--android", "wip"]),
    /must be "building" or "done"/,
  );
});

test("parseArgs: --rn maps to react_native", () => {
  const parsed = parseArgs(["set", "foo", "--rn", "building"]);
  assert.deepEqual(parsed.platforms.react_native, { status: "building" });
});

test("parseArgs: list and rm", () => {
  assert.deepEqual(parseArgs(["list"]), { command: "list" });
  assert.deepEqual(parseArgs(["rm", "foo"]), { command: "rm", slug: "foo" });
});

test("mergePlatforms: adds a new platform with status", () => {
  assert.deepEqual(mergePlatforms({}, { ios: { status: "building" } }), {
    ios: { status: "building" },
  });
});

test("mergePlatforms: merges url into existing platform, keeps others", () => {
  const merged = mergePlatforms(
    { android: { status: "done" }, ios: { status: "building" } },
    { ios: { url: "https://y" } },
  );
  assert.deepEqual(merged.android, { status: "done" });
  assert.deepEqual(merged.ios, { status: "building", url: "https://y" });
});

test("mergePlatforms: throws when a new platform has a url but no status", () => {
  assert.throws(() => mergePlatforms({}, { ios: { url: "https://y" } }), /needs a status/);
});

test("buildSetValues: a new project requires title and summary", () => {
  assert.throws(
    () => buildSetValues(null, { slug: "x", fields: {}, platforms: {} }, 1),
    /requires --title and --summary/,
  );
});

test("buildSetValues: patches existing fields and bumps updated_at", () => {
  const existing = {
    title: "Film Nest",
    summary: "old",
    tags: ["Kotlin"],
    platforms: { android: { status: "building" } },
  };
  const parsed = { slug: "film-nest", fields: {}, platforms: { android: { status: "done" } } };
  const values = buildSetValues(existing, parsed, 12345);
  assert.equal(values.title, "Film Nest");
  assert.equal(values.updated_at, 12345);
  assert.deepEqual(JSON.parse(values.platforms), { android: { status: "done" } });
  assert.deepEqual(JSON.parse(values.tags), ["Kotlin"]);
});
