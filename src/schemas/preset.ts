// src/schemas/preset.ts
import { z } from "zod";
import { BreakdownEntrySchema } from "./breakdown";

//
// ID-only schemas
//
const itemSchema = z.object({
  id: z.string().default(""),
});

const familiarSchema = z.object({
  id: z.string().default(""),
});

const relicSchema = z.object({
  id: z.string().default(""),
});

//
// Helpers
//
function normalize<T>(arr: T[] | undefined, len: number, blank: () => T): T[] {
  return Array.from({ length: len }, (_, i) => arr?.[i] ?? blank());
}

//
// Main schema
//
export const presetSchema = z.object({
  presetName: z.string().default(""),
  presetNotes: z.string().default(""),

  inventorySlots: z.preprocess(
    (val) => normalize(val as any[], 28, () => ({ id: "" })),
    z.array(itemSchema).length(28)
  ),

  equipmentSlots: z.preprocess(
    (val) => normalize(val as any[], 13, () => ({ id: "" })),
    z.array(itemSchema).length(13)
  ),

  relics: z.object({
    primaryRelics: z.array(relicSchema).default([]),
    alternativeRelics: z.array(relicSchema).default([]),
  }),

  familiars: z.object({
    primaryFamiliars: z.array(familiarSchema).default([]),
    alternativeFamiliars: z.array(familiarSchema).default([]),
  }),

  breakdown: z.array(BreakdownEntrySchema).default([]),
});

export type Preset = z.infer<typeof presetSchema>;

//
// Blank preset used when creating new
//
export const blankPreset: Preset = {
  presetName: "",
  presetNotes: "",
  inventorySlots: Array.from({ length: 28 }, () => ({ id: "" })),
  equipmentSlots: Array.from({ length: 13 }, () => ({ id: "" })),
  relics: {
    primaryRelics: [],
    alternativeRelics: [],
  },
  familiars: {
    primaryFamiliars: [],
    alternativeFamiliars: [],
  },
  breakdown: [],
};
