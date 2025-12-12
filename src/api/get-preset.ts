// src/api/get-preset.ts
import axios from "axios";
import { type SavedPreset } from "../schemas/saved-preset-data";
import { loadEmojis } from "../emoji";

export async function getPreset(id: string): Promise<SavedPreset> {
  const url = `/api/presets/${id}`;
  const { data } = await axios.get(url);

  const emojis = await loadEmojis();

  function migrateSlot(slot: any) {
    if (!slot) return { id: "" };

    // Any legacy fields collapse to a raw string we feed into resolver
    const raw =
      slot?.id ??
      slot?.label ??    // legacy
      slot?.name ??     // legacy
      slot ??           // very old format: string
      "";

    const resolved = emojis.resolve(raw.toString().toLowerCase());
    return { id: resolved };
  }

  const migrated: SavedPreset = {
    presetName: data.presetName ?? "",
    presetNotes: data.presetNotes ?? "",

    inventorySlots: (data.inventorySlots || []).map(migrateSlot),
    equipmentSlots: (data.equipmentSlots || []).map(migrateSlot),

    familiars: {
      primaryFamiliars: (data.familiars?.primaryFamiliars || []).map(migrateSlot),
      alternativeFamiliars: (data.familiars?.alternativeFamiliars || []).map(migrateSlot),
    },

    relics: {
      primaryRelics: (data.relics?.primaryRelics || []).map(migrateSlot),
      alternativeRelics: (data.relics?.alternativeRelics || []).map(migrateSlot),
    },

    breakdown: data.breakdown ?? [],
  };

  return migrated;
}
