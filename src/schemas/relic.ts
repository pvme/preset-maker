// src/schemas/relic.ts
import { z } from 'zod'
import { entitySchema } from './entity-data'

export const relicSchema = entitySchema
  .omit({ image: true })
  .extend({
    image: z.string().min(1),
    energy: z.number(),
    description: z.string().optional()
  })

export type Relic = z.infer<typeof relicSchema>

export const relicsSchema = z.object({
  primaryRelics: z.array(relicSchema),
  alternativeRelics: z.array(relicSchema)
})

export type Relics = z.infer<typeof relicsSchema>
