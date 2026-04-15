// src/constants/PresetEditor/equipmentSlots.ts
export const UI_TO_PRESET_SLOT = [1, 12, 10, 4, 2, 5, 3, 6, 7, 11, 9, 13];

export const UI_TO_EQUIPMENT_SLOT_LABEL = [
  "head",
  "cape",
  "neck",
  "weapon",
  "body",
  "shield",
  "legs",
  "hands",
  "feet",
  "ring",
  "ammo",
  "pocket",
] as const;

export const SLOT_LABEL_TO_PRESET_SLOT: Record<string, number> =
  Object.fromEntries(
    UI_TO_EQUIPMENT_SLOT_LABEL.map((label, i) => [
      label,
      UI_TO_PRESET_SLOT[i],
    ])
  );
