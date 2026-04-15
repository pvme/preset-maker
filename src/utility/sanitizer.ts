// src/utility/sanitizer.ts

import { type SavedPreset } from "../schemas/saved-preset-data";

const sanitizeSlots = (
  slots: Array<{ id?: string }> | undefined,
  expectedLength: number,
): Array<{ id: string }> => {
  const safe = Array.isArray(slots) ? slots : [];

  // Legacy 13-slot equipment arrays still contain aura at index 11
  const withoutAura =
    expectedLength === 12 && safe.length >= 13
      ? safe.filter((_, index) => index !== 11)
      : safe;

  return Array.from({ length: expectedLength }, (_, index) => ({
    id: withoutAura[index]?.id ?? "",
  }));
};

export const sanitizePresetData = (preset: SavedPreset): SavedPreset => {
  return {
    presetId: preset.presetId,
    presetName: preset.presetName ?? "",
    presetNotes: preset.presetNotes ?? "",

    inventorySlots: sanitizeSlots(preset.inventorySlots, 28),
    equipmentSlots: sanitizeSlots(preset.equipmentSlots, 12),

    relics: {
      primaryRelics:
        preset.relics?.primaryRelics?.map((r) => ({ id: r.id ?? "" })) ?? [],
      alternativeRelics:
        preset.relics?.alternativeRelics?.map((r) => ({ id: r.id ?? "" })) ??
        [],
    },

    familiars: {
      primaryFamiliars:
        preset.familiars?.primaryFamiliars?.map((f) => ({ id: f.id ?? "" })) ??
        [],
      alternativeFamiliars:
        preset.familiars?.alternativeFamiliars?.map((f) => ({
          id: f.id ?? "",
        })) ?? [],
    },

    breakdown: preset.breakdown ?? [],

    presetImage: preset.presetImage ?? undefined,
  };
};

export const sanitizeAndStringifyPreset = (preset: SavedPreset): string => {
  return JSON.stringify(sanitizePresetData(preset));
};
