// src/schemas/preset.ts
import { z } from 'zod';
import { makeMaybe } from './util';
import { entitySchema } from './entity-data';
import { familiarSchema } from './familiar';
import { relicSchema } from './relic';

// You can reuse entitySchema directly for items (if appropriate)
const maybeItem = makeMaybe(entitySchema);
const maybeRelic = makeMaybe(relicSchema);
const maybeFamiliar = makeMaybe(familiarSchema);

export const presetSchema = z.object({
  presetName: z.string().min(1, 'Name is required'),
  presetNotes: z.string().optional(),

  inventorySlots: z.preprocess((val) => {
    if (!Array.isArray(val)) return Array(28).fill({});
    return Array.from({ length: 28 }, (_, i) => val[i] ?? {});
  }, z.array(maybeItem).length(28)),

  equipmentSlots: z.preprocess((val) => {
    if (!Array.isArray(val)) return Array(13).fill({});
    return Array.from({ length: 13 }, (_, i) => val[i] ?? {});
  }, z.array(maybeItem).length(13)),

  relics: z.object({
    primaryRelics: z.array(maybeRelic).optional(),
    alternativeRelics: z.array(maybeRelic).optional()
  }),

  familiars: z.object({
    primaryFamiliars: z.array(maybeFamiliar).optional(),
    alternativeFamiliars: z.array(maybeFamiliar).optional()
  })
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
