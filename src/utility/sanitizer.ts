// src/utility/sanitizer.ts

import { type SavedPreset } from "../schemas/saved-preset-data";

export const sanitizePresetData = (preset: SavedPreset): SavedPreset => {
  return {
    presetId: preset.presetId,
    presetName: preset.presetName ?? "",
    presetNotes: preset.presetNotes ?? "",

    inventorySlots: preset.inventorySlots.map((s) => ({ id: s.id ?? "" })),
    equipmentSlots: preset.equipmentSlots.map((s) => ({ id: s.id ?? "" })),

    relics: {
      primaryRelics: preset.relics?.primaryRelics?.map((r) => ({ id: r.id ?? "" })) ?? [],
      alternativeRelics: preset.relics?.alternativeRelics?.map((r) => ({ id: r.id ?? "" })) ?? [],
    },

    familiars: {
      primaryFamiliars: preset.familiars?.primaryFamiliars?.map((f) => ({ id: f.id ?? "" })) ?? [],
      alternativeFamiliars:
        preset.familiars?.alternativeFamiliars?.map((f) => ({ id: f.id ?? "" })) ?? [],
    },

    breakdown: preset.breakdown ?? [],

    presetImage: preset.presetImage ?? undefined,
  };
};

export const sanitizeAndStringifyPreset = (preset: SavedPreset): string => {
  return JSON.stringify(sanitizePresetData(preset));
};
