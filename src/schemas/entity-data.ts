// src/schemas/entity-data.ts
import { z } from 'zod';

export const entitySchema = z.object({
  name: z.string().default(''),
  label: z.string().default(''),
  image: z.string().default(''),
  breakdownNotes: z.string().default(''),
  wikiLink: z.string().default(''),
  selected: z.boolean().default(false).optional(),
  slot: z.number().optional(),
});

export type Entity = z.infer<typeof entitySchema>;
