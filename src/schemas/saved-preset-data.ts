// src/schemas/saved-preset-data.ts

import { type BreakdownEntry } from "./breakdown";
import { type Item } from "./item-data";

export interface LegacySavedPreset {
  presetId?: string;
  presetName: string;
  presetNotes: string;
  inventorySlots: Item[];
  equipmentSlots: Item[];
  relics?: {
    primaryRelics?: Item[];
    alternativeRelics?: Item[];
  };
  familiars?: {
    primaryFamiliars?: Item[];
    alternativeFamiliars?: Item[];
  };
  breakdown: BreakdownEntry[];
  presetImage?: string;
}

export interface SavedPreset {
  presetId?: string;
  presetName: string;
  presetNotes: string;
  inventorySlots: Item[];
  equipmentSlots: Item[];
  familiar?: Item;
  relics?: Item[];
  aspect?: Item;
  AmmoSpells?: Item[];
  breakdown: BreakdownEntry[];
  presetImage?: string;
}

export const EMPTY_SAVED_PRESET: SavedPreset = {
  presetName: "",
  presetNotes: "",
  inventorySlots: Array.from({ length: 28 }, () => ({ id: "" })),
  equipmentSlots: Array.from({ length: 12 }, () => ({ id: "" })),
  familiar: { id: "" },
  relics: [],
  aspect: { id: "" },
  AmmoSpells: [],
  breakdown: [],
};
