import { rawGithubJSONRequest } from '../api/github';

// RegExp to match <:foo:id> to the ID portion.
// eslint-disable-next-line prefer-regex-literals
// const DISCORD_EMOJI_REGEXP = new RegExp('<:([^:]{2,}):([0-9]+)>', 'i');
const DISCORD_EMOJI_REGEXP = /<:([^:]{2,}):([0-9]+)>/i;

class EmojiSettingsLoader {
  /**
   * Mapping of emoji alias to the Discord emoji ID tag, e.g. <:name:ID>.
   */
  emojiMap: Record<string, string> = {};

  getEmojiId (alias: string): string | undefined {
    const discordEmojiTag = this.emojiMap[alias.toLowerCase()] ?? undefined;
    if (discordEmojiTag === undefined) {
      return undefined;
    }

    return this._getDiscordIdFromTag(discordEmojiTag) ?? alias;
  }

  getEmojiImgTag (emojiId: string, alias: string): string {
    return `<img title="${alias}" class="disc-emoji" src="https://cdn.discordapp.com/emojis/${emojiId}.png?v=1">`;
  }

  async load (): Promise<void> {
    const emojisJSON = await rawGithubJSONRequest('https://raw.githubusercontent.com/pvme/rotation-builder/main/settings.json');
    for (const [emoji, aliases] of Object.entries(emojisJSON)) {
      for (const alias of aliases) {
        this.emojiMap[alias.toLowerCase()] = emoji;
      }
    }
  }

  _getDiscordIdFromTag (discordEmojiTag: string): string {
    const matches = DISCORD_EMOJI_REGEXP.exec(discordEmojiTag);
    if (matches === null) {
      return discordEmojiTag;
    }

    return matches[2];
  }
}

export const EmojiSettings = new EmojiSettingsLoader();
