// src/emoji/loadEmojis.ts
import { EmojiEntry, EmojiMaps } from "./types";
import { createIdResolver } from "./idResolver";

let cached: EmojiMaps | null = null;

const EMOJI_URL =
  "https://raw.githubusercontent.com/pvme/pvme-settings/refs/heads/master/emojis/emojis_v2.json";

const CDN_PREFIX = "https://img.pvme.io/images/";

export async function loadEmojis(): Promise<EmojiMaps> {
  if (cached) return cached;

  const res = await fetch(EMOJI_URL);
  const json = await res.json();

  // Flatten categories → array of EmojiEntry
  const all: EmojiEntry[] = [];
  for (const cat of json.categories) {
    for (const e of cat.emojis) all.push(e);
  }

  const resolver = createIdResolver(all);

  const byId: Record<string, EmojiEntry> = {};
  const byAlias: Record<string, string> = {};
  const byType: Record<string, EmojiEntry[]> = {};

  for (const e of all) {
    const id = resolver.resolve(e.id);
    const entry: EmojiEntry = {
      ...e,
      id,
      image: e.image || undefined,
      preset_type: e.preset_type || undefined,
      preset_slot: e.preset_slot ?? null,
    };

    byId[id] = entry;

    if (Array.isArray(e.id_aliases)) {
      for (const alias of e.id_aliases) {
        byAlias[alias.toLowerCase()] = id;
      }
    }

    const type = entry.preset_type || "misc";
    if (!byType[type]) byType[type] = [];
    byType[type].push(entry);
  }

  function get(id: string) {
    return byId[id];
  }

  function getUrl(id: string) {
    const e = byId[id];
    if (!e?.image) return undefined;
    return CDN_PREFIX + e.image;
  }

  function resolveId(input: string) {
    return resolver.resolve(input);
  }

  cached = { byId, byAlias, byType, getUrl, get, resolve: resolveId };
  return cached;
}
