// src/schemas/preset.ts
import { z } from 'zod';
import { makeMaybe } from './util';
import { entitySchema } from './entity-data';
import { familiarSchema } from './familiar';
import { relicSchema } from './relic';

const maybeItem = makeMaybe(entitySchema);
const maybeRelic = makeMaybe(relicSchema);
const maybeFamiliar = makeMaybe(familiarSchema);

function normalizeArray<T>(arr: T[] | undefined, len: number): T[] {
  return Array.from({ length: len }, (_, i) => (arr?.[i] ?? {} as T));
}

export const presetSchema = z.object({
  presetName: z.string().min(1, 'Name is required'),
  presetNotes: z.string().optional(),

  // Normalized slot arrays
  inventorySlots: z.preprocess(
    (val) => normalizeArray(val as any[], 28),
    z.array(maybeItem).length(28)
  ),

  equipmentSlots: z.preprocess(
    (val) => normalizeArray(val as any[], 13),
    z.array(maybeItem).length(13)
  ),

  relics: z.object({
    primaryRelics: z.array(maybeRelic).default([]),
    alternativeRelics: z.array(maybeRelic).default([]),
  }),

  familiars: z.object({
    primaryFamiliars: z.array(maybeFamiliar).default([]),
    alternativeFamiliars: z.array(maybeFamiliar).default([]),
  }),
});

export type Preset = z.infer<typeof presetSchema>;

const emptyItem = {
  name: '',
  label: '',
  image: '',
  breakdownNotes: '',
  wikiLink: '',
  selected: false,
  slot: undefined,
};

export const blankPreset = {
  presetName: '',
  presetNotes: '',
  inventorySlots: Array.from({ length: 28 }, () => ({ ...emptyItem })),
  equipmentSlots: Array.from({ length: 13 }, () => ({ ...emptyItem })),
  relics: {
    primaryRelics: [],
    alternativeRelics: [],
  },
  familiars: {
    primaryFamiliars: [],
    alternativeFamiliars: [],
  },
} satisfies Preset;
