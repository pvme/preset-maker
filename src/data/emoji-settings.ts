import { rawGithubJSONRequest } from '../api/github';

// RegExp to match <:foo:id> to the ID portion.
// eslint-disable-next-line prefer-regex-literals
// const DISCORD_EMOJI_REGEXP = new RegExp('<:([^:]{2,}):([0-9]+)>', 'i');
const DISCORD_EMOJI_REGEXP = /<:([^:]{2,}):([0-9]+)>/i;

interface EmojiServer {
  server: string
  url: string
};

interface Emoji {
  name: string
  emoji_name: string
  emoji_id: string
  aliases: string[]
  server: string
};

interface EmojiCategory {
  name: string
  emojis: Emoji[]
};

interface EmojiJson {
  servers: EmojiServer[]
  categories: EmojiCategory[]
};

interface EmojiMapEntry {
  alias: string
  discordEmojiTag: string
}

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
    const emojiObj: EmojiJson = await rawGithubJSONRequest('https://raw.githubusercontent.com/pvme/pvme-settings/master/emojis/emojis.json');
    const emojiAliasAndDiscordIds = this._parseEmojis(emojiObj);
    emojiAliasAndDiscordIds.forEach(({
      alias,
      discordEmojiTag
    }) => {
      this.emojiMap[alias.toLowerCase()] = discordEmojiTag;
    });
  }

  _parseEmojis (emojiJson: EmojiJson): EmojiMapEntry[] {
    const flattenedEmojis = emojiJson.categories.reduce((emojis: Emoji[], category: EmojiCategory) => {
      return [
        ...emojis,
        ...category.emojis
      ];
    }, []);
    const emojiMapEntries = flattenedEmojis.reduce((emojiMapEntries: EmojiMapEntry[], emoji: Emoji) => {
      const aliasEmojis = emoji.aliases.map((alias) => {
        return {
          alias,
          discordEmojiTag: this._getDiscordEmojiTag(alias, emoji.emoji_id)
        };
      });

      const primaryEmoji = {
        alias: emoji.emoji_name,
        discordEmojiTag: this._getDiscordEmojiTag(emoji.emoji_name, emoji.emoji_id)
      };

      return [
        ...emojiMapEntries,
        ...aliasEmojis,
        primaryEmoji
      ];
    }, []);
    return emojiMapEntries;
  }

  _getDiscordEmojiTag (alias: string, id: string): string {
    return `<:${alias}:${id}>`;
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
