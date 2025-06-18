// src/schemas/familiar.ts
import { z } from 'zod'
import { entitySchema } from './entity-data'

export const familiarSchema = entitySchema // extend later if needed

export type Familiar = z.infer<typeof familiarSchema>

export const familiarsSchema = z.object({
  primaryFamiliars: z.array(familiarSchema),
  alternativeFamiliars: z.array(familiarSchema)
})

export type Familiars = z.infer<typeof familiarsSchema>
