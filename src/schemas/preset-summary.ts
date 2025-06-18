import { z } from 'zod';

export const presetSummarySchema = z.object({
  presetId: z.string(),
  presetName: z.string(),
});

export type PresetSummary = z.infer<typeof presetSummarySchema>;
