// src/schemas/relic.ts
import { z } from 'zod';

export const relicSchema = z.object({
  label: z.string().default(''),
  name: z.string().default(''),
  image: z.string().default(''),
  breakdownNotes: z.string().default(''),
  energy: z.number().default(0),
  description: z.string().default(''),
});

export const relicsSchema = z.object({
  primaryRelics: z.array(relicSchema).default([]),
  alternativeRelics: z.array(relicSchema).default([]),
});

export type Relic = z.infer<typeof relicSchema>;
export type Relics = z.infer<typeof relicsSchema>;
