import { type EmojiEntry } from "./types";

export function getEmojiDisplayName(
  entry: EmojiEntry,
  eofSpec?: string,
) {
  if (eofSpec) return `EoF (${eofSpec})`;
  return entry.name;
}

export function getEmojiAmmoHoverNote(entry: EmojiEntry | undefined) {
  const ammo = entry?.ammo?.map((ammoId) => `;${ammoId};`).join(" ");
  return ammo ? `Ammo: ${ammo}` : "";
}

export function prependAutomaticNote(automaticNote: string, note?: string) {
  const emojiTokens = automaticNote.match(/;[a-zA-Z0-9_-]+;/g) ?? [];
  const hasAutomaticAmmo = emojiTokens.length > 0 && emojiTokens.every((token) => note?.includes(token));

  if (!automaticNote || hasAutomaticAmmo) return note ?? "";
  return [automaticNote, note].filter(Boolean).join("\n");
}

export function removeAutomaticAmmoNote(automaticNote: string, note?: string) {
  if (!note) return note;

  const emojiTokens = automaticNote.match(/;[a-zA-Z0-9_-]+;/g) ?? [];
  if (!emojiTokens.length) return note;

  return note
    .split(/\r?\n/)
    .filter((line) => !emojiTokens.every((token) => line.includes(token)))
    .join("\n")
    .trim();
}
