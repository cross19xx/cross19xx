export type KitchenStatus = "building" | "done";

export type KitchenPlatformKey = "android" | "ios" | "react_native";

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
  { key: "android", label: "Android" },
  { key: "ios", label: "iOS" },
  { key: "react_native", label: "React Native" },
];

export const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string> = {
  building: "Under Construction",
  done: "Done",
};

/** Convert a raw Turso row into a typed project, tolerating malformed JSON. */
export function parseKitchenRow(row: Record<string, unknown>): KitchenProject {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(String(row.tags ?? "[]"));
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    tags = [];
  }

  let platforms: KitchenProject["platforms"] = {};
  try {
    const parsed = JSON.parse(String(row.platforms ?? "{}"));
    if (parsed && typeof parsed === "object") platforms = parsed as KitchenProject["platforms"];
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
