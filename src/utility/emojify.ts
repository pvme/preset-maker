import { EmojiSettings } from '../data/emoji-settings';

/**
 * Convert emoji aliases to <img> tags displaying the emoji.
 *
 * e.g.:
 *   INPUT: "text ;gbarge; more text ;greaterbarge;"
 *   OUTPUT: "text <img src...""> more text <img src..>"
 */
export function emojify (text: string): string {
  const regexp = /;([a-zA-Z0-9_-]+);/g;
  const emojiAliasResults = [...text.matchAll(regexp)];
  const emojiDiscordIds = emojiAliasResults.reverse().map(([match, alias]) => {
    const emojiId = EmojiSettings.getEmojiId(alias);
    if (emojiId === undefined) {
      return {
        alias,
        mappedText: alias
      };
    }

    return {
      alias,
      mappedText: EmojiSettings.getEmojiImgTag(emojiId)
    };
  });

  let emojifiedText = text;
  emojiDiscordIds.forEach(({ alias, mappedText }) => {
    emojifiedText = emojifiedText.replace(`;${alias};`, mappedText);
  });
  return emojifiedText;
}
