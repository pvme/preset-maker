// src/utility/emojify.ts

import { getEmojiIndex } from "../emoji/globalEmojiIndex";

export function emojify(text: string): string {
  const emojis = getEmojiIndex();
  if (!emojis) return text;

  const aliasRegex = /[:;]([a-zA-Z0-9_-]+)[:;]/g;

  return text.replace(aliasRegex, (fullMatch, rawAlias: string) => {
    const alias = rawAlias.toLowerCase();

    const emoji = emojis.find((e) => {
      const normalizedName = e.name.replace(/\s+/g, "").toLowerCase();
      const idAliases = (e.id_aliases ?? []).map((a) => a.toLowerCase());
      return (
        e.id.toLowerCase() === alias ||
        idAliases.includes(alias) ||
        normalizedName === alias
      );
    });

    if (!emoji) return fullMatch;

    let url = "";
    if (emoji.image) {
      url = emoji.image.startsWith("http")
        ? emoji.image
        : `https://img.pvme.io/images/${emoji.image}`;
    } else if (emoji.emoji_id) {
      url = `https://cdn.discordapp.com/emojis/${emoji.emoji_id}.png?size=96&quality=lossless`;
    } else {
      return fullMatch;
    }
    
    return `<img
      class="disc-emoji"
      src="${url}"
      alt="${emoji.name}"
      title="${emoji.name}"
      data-emoji="${fullMatch}"
    />`;
  });
}
