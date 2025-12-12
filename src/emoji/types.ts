// src/emoji/types.ts

export interface EmojiEntry {
  id: string;
  name: string;
  image?: string;          // filename only
  preset_type?: string;     // "item" | "familiar" | "relic" | "ability"
  preset_slot?: number | null;
  emoji_id?: string;
  emoji_server?: string;
  id_aliases?: string[];
}

export interface EmojiMaps {
  byId: Record<string, EmojiEntry>;
  byAlias: Record<string, string>;
  byType: Record<string, EmojiEntry[]>;
  getUrl: (id: string) => string | undefined;
  get: (id: string) => EmojiEntry | undefined;
  resolve: (input: string) => string;
}
