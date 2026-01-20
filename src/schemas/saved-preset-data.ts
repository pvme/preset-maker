// src/schemas/saved-preset-data.ts

import { type BreakdownEntry } from "./breakdown";
import { type Item } from "./item-data";
import { type Relics } from "./relic";
import { type Familiars } from "./familiar";

export interface SavedPreset {
  presetId?: string;

  presetName: string;
  presetNotes: string;

  inventorySlots: Item[];
  equipmentSlots: Item[];

  relics: Relics;
  familiars: Familiars;

  breakdown: BreakdownEntry[];

  // legacy field — retained only for compatibility when loading old presets,
  // but NEVER saved any more
  presetImage?: string;
}

/* -------------------------------------------------------------------------- */
/* Canonical empty preset (MUST match reducer shape)                           */
/* -------------------------------------------------------------------------- */

export const EMPTY_SAVED_PRESET: SavedPreset = {
  presetName: "",
  presetNotes: "",

  inventorySlots: Array.from({ length: 28 }, () => ({ id: "" })),
  equipmentSlots: Array.from({ length: 13 }, () => ({ id: "" })),

  relics: {
    primaryRelics: Array.from({ length: 3 }, () => ({ id: "" })),
    alternativeRelics: Array.from({ length: 3 }, () => ({ id: "" })),
  },

  familiars: {
    primaryFamiliars: Array.from({ length: 1 }, () => ({ id: "" })),
    alternativeFamiliars: Array.from({ length: 3 }, () => ({ id: "" })),
  },

  breakdown: [],
};
