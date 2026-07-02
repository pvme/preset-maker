// src/utility/sanitizer.ts

import { type SavedPreset } from "../schemas/saved-preset-data";
import { Item } from "../schemas/item-data";

const sanitizeSlots = (
  slots: Array<{ id?: string; eof_spec?: string }> | undefined,
  expectedLength: number,
): Array<{ id: string; eof_spec?: string }> => {
  const safe = Array.isArray(slots) ? slots : [];

  // Legacy 13-slot equipment arrays still contain aura at index 11
  const withoutAura =
    expectedLength === 12 && safe.length >= 13
      ? safe.filter((_, index) => index !== 11)
      : safe;

  return Array.from({ length: expectedLength }, (_, index) => {
    const slot = withoutAura[index];
    const eofSpec = slot?.eof_spec?.trim();
    return {
      id: slot?.id ?? "",
      ...(eofSpec ? { eof_spec: eofSpec } : {}),
    };
  });
};

const sanitizeItem = (item: Item): Item => ({
  id: item.id ?? "",
  ...(item.eof_spec?.trim() ? { eof_spec: item.eof_spec.trim() } : {}),
});

export const sanitizePresetData = (preset: SavedPreset): SavedPreset => {
  return {
    presetId: preset.presetId,
    presetName: preset.presetName ?? "",
    presetNotes: preset.presetNotes ?? "",

    inventorySlots: sanitizeSlots(preset.inventorySlots, 28),
    equipmentSlots: sanitizeSlots(preset.equipmentSlots, 12),

    relics: (preset.relics ?? []).map(sanitizeItem),

    familiar: preset.familiar ? sanitizeItem(preset.familiar) : undefined,

    breakdown: preset.breakdown ?? [],

    presetImage: preset.presetImage ?? undefined,
  };
};

export const sanitizeAndStringifyPreset = (preset: SavedPreset): string => {
  return JSON.stringify(sanitizePresetData(preset));
};
