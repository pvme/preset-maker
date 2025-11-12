// src/schemas/relic.ts
import { z } from 'zod'
import { z } from 'zod';

export const relicSchema = z.object({
  label: z.string().default(''),
  name: z.string().default(''),
  image: z.string().default(''),
  breakdownNotes: z.string().default(''),
  energy: z.number().default(0),
  description: z.string().default(''),
});

export type Relic = z.infer<typeof relicSchema>;
export type Relics = {
  primaryRelics?: Relic[];
  alternativeRelics?: Relic[];
};
