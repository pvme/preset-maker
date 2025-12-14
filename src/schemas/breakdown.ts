// src/schemas/breakdown.ts
import { z } from "zod";

export const BreakdownEntrySchema = z.object({
  slotType: z.enum(["inventory", "equipment"]),
  slotIndex: z.number().min(0),
  description: z.string().default(""),
});

export type BreakdownEntry = z.infer<typeof BreakdownEntrySchema>;
