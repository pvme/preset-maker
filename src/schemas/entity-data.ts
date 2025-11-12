// src/schemas/entity-data.ts
import { z } from 'zod';

export const entitySchema = z.object({
  name: z.string().optional().default(''),
  label: z.string().optional().default(''),
  image: z.string().optional().default(''),
  breakdownNotes: z.string().optional().default(''),
  wikiLink: z.string().optional().default(''),
  selected: z.boolean().default(false),
  slot: z.number().optional(),
});

export type Entity = z.infer<typeof entitySchema>;
