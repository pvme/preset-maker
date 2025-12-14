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
