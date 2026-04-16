// src/emoji/loadEmojis.ts

import { EmojiEntry, EmojiMaps } from "./types";
import { createIdResolver } from "./idResolver";
import { SLOT_LABEL_TO_PRESET_SLOT } from "../components/PresetEditor/equipmentSlots";

let cached: EmojiMaps | null = null;
let loadingPromise: Promise<EmojiMaps> | null = null;

const EMOJI_URL = `https://raw.githubusercontent.com/pvme/pvme-settings/refs/heads/master/emojis/emojis_v2.json?v=${Date.now()}`;

const PVME_CDN = "https://img.pvme.io/images/";
const DISCORD_CDN = "https://cdn.discordapp.com/emojis/";

export async function loadEmojis(): Promise<EmojiMaps> {
  if (cached) return cached;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const res = await fetch(EMOJI_URL, { cache: "no-store" });
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
    const bySlot: Record<number, EmojiEntry[]> = {};

    for (const e of all) {
      const id = resolver.resolve(e.id);

      const entry: EmojiEntry = {
        ...e,
        id,
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

      if (entry.preset_slot != null) {
        if (!bySlot[entry.preset_slot]) bySlot[entry.preset_slot] = [];
        bySlot[entry.preset_slot].push(entry);
      }
    }

    function get(input: string): EmojiEntry | undefined {
      const key = input.toLowerCase().trim();

      if (byId[key]) return byId[key];

      if (key in SLOT_LABEL_TO_PRESET_SLOT) {
        const slot = SLOT_LABEL_TO_PRESET_SLOT[key];
        return bySlot[slot]?.[0];
      }

      const num = Number(key);
      if (!Number.isNaN(num)) {
        return bySlot[num]?.[0];
      }

      return undefined;
    }

    function getUrl(input: string): string | undefined {
      const e = get(input);
      if (!e) return undefined;

      if (e.emoji_id) {
        return `${DISCORD_CDN}${e.emoji_id}.png`;
      }

      if (e.image) {
        return e.image.startsWith("http") ? e.image : `${PVME_CDN}${e.image}`;
      }

      return undefined;
    }

    function resolveId(input: string) {
      const key = input.toLowerCase().trim();

      const aliasMatch = byAlias[key];
      if (aliasMatch) return aliasMatch;

      const resolved = resolver.resolve(key);
      if (byId[resolved]) return resolved;

      if (key in SLOT_LABEL_TO_PRESET_SLOT) return key;

      const num = Number(key);
      if (!Number.isNaN(num) && bySlot[num]?.length) return key;

      return resolved;
    }

    cached = {
      byId,
      byAlias,
      byType,
      bySlot,
      getUrl,
      get,
      resolve: resolveId,
    };

    return cached;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}
