// src/schemas/item-data.ts
import { z } from 'zod'
import { entitySchema } from './entity-data'

export const itemSchema = entitySchema.extend({
  selected: z.boolean().optional(),
  slot: z.number().optional()
})

export type Item = z.infer<typeof itemSchema>