// src/schemas/entity-data.ts
import { z } from 'zod'

export const entitySchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  image: z.string().default(''),
  breakdownNotes: z.string().optional(),
  wikiLink: z.string().optional()
})

export type Entity = z.infer<typeof entitySchema>
