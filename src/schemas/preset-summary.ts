import { z } from 'zod';

export const presetSummarySchema = z.object({
  presetId: z.string(),
  presetName: z.string(),
  source: z.union([z.literal('local'), z.literal('cloud')]),
});

export type PresetSummary = z.infer<typeof presetSummarySchema>;
