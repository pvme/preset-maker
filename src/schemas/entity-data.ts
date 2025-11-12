// src/schemas/entity-data.ts
import { z } from 'zod';

export const entitySchema = z.object({
  name: z.string().optional().default(''),
  label: z.string().optional().default(''),
  image: z.string().optional().default(''),
  breakdownNotes: z.string().optional().default(''),
  wikiLink: z.string().optional().default(''),
  // Allow undefined for TS, but normalize to false at runtime
  selected: z.preprocess(
    (v) => (v === undefined ? false : v),
    z.boolean()
  ).optional(),
  slot: z.number().optional(),
});

export type Entity = z.infer<typeof entitySchema>;
