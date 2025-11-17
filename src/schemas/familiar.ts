// src/schemas/familiar.ts
import { z } from 'zod';

export const familiarSchema = z.object({
  label: z.string().default(''),
  name: z.string().default(''),
  image: z.string().default(''),
  breakdownNotes: z.string().default(''),
});

export const familiarsSchema = z.object({
  primaryFamiliars: z.array(familiarSchema).default([]),
  alternativeFamiliars: z.array(familiarSchema).default([]),
});

export type Familiar = z.infer<typeof familiarSchema>;
export type Familiars = z.infer<typeof familiarsSchema>;
