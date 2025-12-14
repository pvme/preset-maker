// src/emoji/idResolver.ts
import { EmojiEntry } from "./types";

export function createIdResolver(emojis: EmojiEntry[]) {
  const byId: Record<string, string> = {};
  const byAlias: Record<string, string> = {};

  for (const e of emojis) {
    if (e.id) byId[e.id] = e.id;

    if (Array.isArray(e.id_aliases)) {
      for (const alias of e.id_aliases) {
        byAlias[alias.toLowerCase()] = e.id;
      }
    }
  }

  function resolve(input: string | undefined): string {
    if (!input) return "";
    const key = input.toLowerCase();

    if (byId[key]) return key;
    if (byAlias[key]) return byAlias[key];

    return key; // fallback
  }

  return { resolve };
}
