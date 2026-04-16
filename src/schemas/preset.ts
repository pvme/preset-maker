// src/schemas/preset.ts

import { z } from "zod";
import { BreakdownEntrySchema } from "./breakdown";

const itemSchema = z.object({
  id: z.string().default(""),
});

const singleSlotSchema = z.object({
  id: z.string().default(""),
});

function normalize<T>(arr: T[] | undefined, len: number, blank: () => T): T[] {
  return Array.from({ length: len }, (_, i) => arr?.[i] ?? blank());
}

function normalizeMax<T>(
  arr: T[] | undefined,
  max: number,
  blank?: () => T,
): T[] {
  const list = Array.isArray(arr) ? arr.slice(0, max) : [];
  if (!blank) return list;
  return list.map((item) => item ?? blank());
}

export const presetSchema = z.object({
  presetName: z.string().default(""),
  presetNotes: z.string().default(""),

  inventorySlots: z.preprocess(
    (val) => normalize(val as any[], 28, () => ({ id: "" })),
    z.array(itemSchema).length(28),
  ),

  equipmentSlots: z.preprocess(
    (val) => normalize(val as any[], 12, () => ({ id: "" })),
    z.array(itemSchema).length(12),
  ),

  familiar: singleSlotSchema.default({ id: "" }),
  relics: z.preprocess(
    (val) => normalizeMax(val as any[], 3),
    z.array(singleSlotSchema).max(3).default([]),
  ),
  aspect: singleSlotSchema.default({ id: "" }),
  AmmoSpells: z.preprocess(
    (val) => normalizeMax(val as any[], 3),
    z.array(singleSlotSchema).max(3).default([]),
  ),

  breakdown: z.array(BreakdownEntrySchema).default([]),
});

export type Preset = z.infer<typeof presetSchema>;

export const blankPreset: Preset = {
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
