// src/emoji/globalEmojiIndex.ts

import type { EmojiEntry } from "./types";

let _emojiIndex: EmojiEntry[] | null = null;

export function setEmojiIndex(list: EmojiEntry[]) {
  _emojiIndex = list;
}

export function getEmojiIndex(): EmojiEntry[] | null {
  return _emojiIndex;
}
