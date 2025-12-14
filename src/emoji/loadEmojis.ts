// src/emoji/loadEmojis.ts

import { EmojiEntry, EmojiMaps } from "./types";
import { createIdResolver } from "./idResolver";

let cached: EmojiMaps | null = null;

const EMOJI_URL =
  "https://raw.githubusercontent.com/pvme/pvme-settings/refs/heads/master/emojis/emojis_v2.json";

const PVME_CDN = "https://img.pvme.io/images/";
const DISCORD_CDN = "https://cdn.discordapp.com/emojis/";

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

      // Preserve both sources
      image: e.image ?? undefined,
      emoji_id: e.emoji_id ?? undefined,
      emoji_server: e.emoji_server ?? undefined,

      preset_type: e.preset_type ?? undefined,
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

  /**
   * Returns the preferred image URL for an emoji.
   * - PVME image takes precedence if present
   * - Falls back to Discord CDN
   */
  function getUrl(id: string): string | undefined {
    const e = byId[id];
    if (!e) return undefined;

    if (e.image) {
      return e.image.startsWith("http")
        ? e.image
        : `${PVME_CDN}${e.image}`;
    }

    if (e.emoji_id) {
      return `${DISCORD_CDN}${e.emoji_id}.png`;
    }

    return undefined;
  }

  function resolveId(input: string) {
    return resolver.resolve(input);
  }

  cached = {
    byId,
    byAlias,
    byType,
    getUrl,
    get,
    resolve: resolveId,
  };

  return cached;
}
