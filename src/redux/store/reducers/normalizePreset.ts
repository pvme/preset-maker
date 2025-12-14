// src/redux/store/reducers/normalizePreset.ts

import { presetSchema, type Preset } from "../../../schemas/preset";
import { loadEmojis } from "../../../emoji";

export async function normalizePreset(raw: any): Promise<Preset> {
  const emojis = await loadEmojis();

  function migrateSlot(slot: any) {
    const rawId =
      slot?.id ??
      slot?.label ??
      (typeof slot === "string" ? slot : "");

    if (!rawId || typeof rawId !== "string") {
      return { id: "" };
    }

    const resolved = emojis.resolve(rawId.toLowerCase());
    return { id: resolved ?? "" };
  }

  const migrated = {
    presetName: raw?.presetName,
    presetNotes: raw?.presetNotes,

    inventorySlots: Array.isArray(raw?.inventorySlots)
      ? raw.inventorySlots.map(migrateSlot)
      : [],

    equipmentSlots: Array.isArray(raw?.equipmentSlots)
      ? raw.equipmentSlots.map(migrateSlot)
      : [],

    relics: {
      primaryRelics: Array.isArray(raw?.relics?.primaryRelics)
        ? raw.relics.primaryRelics.map(migrateSlot)
        : [],
      alternativeRelics: Array.isArray(raw?.relics?.alternativeRelics)
        ? raw.relics.alternativeRelics.map(migrateSlot)
        : [],
    },

    familiars: {
      primaryFamiliars: Array.isArray(raw?.familiars?.primaryFamiliars)
        ? raw.familiars.primaryFamiliars.map(migrateSlot)
        : [],
      alternativeFamiliars: Array.isArray(raw?.familiars?.alternativeFamiliars)
        ? raw.familiars.alternativeFamiliars.map(migrateSlot)
        : [],
    },

    breakdown: raw?.breakdown,
  };

  return presetSchema.parse(migrated);
}
