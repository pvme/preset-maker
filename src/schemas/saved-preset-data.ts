// src/schemas/saved-preset-data.ts

import { z } from 'zod'
import { itemSchema } from './item-data'
import { relicsSchema } from './relic'
import { familiarsSchema } from './familiar'

export const savedPresetSchema = z.object({
  presetId: z.string().optional(),

  presetName: z.string().min(1),
  presetNotes: z.string().optional(),

  inventorySlots: z.array(itemSchema).length(28),
  equipmentSlots: z.array(itemSchema).length(13),

  relics: relicsSchema.optional(),
  familiars: familiarsSchema.optional(),

  presetImage: z.string().optional()
})

export type SavedPreset = z.infer<typeof savedPresetSchema>
