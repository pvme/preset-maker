// src/schemas/util.ts
import { z } from 'zod';

export enum PrimaryOrAlternative {
  None,
  Primary,
  Alternative,
}

export interface IndexedSelection {
  primaryOrAlternative: PrimaryOrAlternative;
  index: number;
}

/**
 * Wraps a base Zod schema to allow optional, nullable, or blank objects.
 * - null / undefined → treated as missing
 * - objects with no label or image → treated as missing
 * - valid objects → filled with safe defaults
 */
export function makeMaybe<T extends z.ZodTypeAny>(base: T) {
  const unionSchema = z.union([base, z.null(), z.undefined()]);

  return z.preprocess((val) => {
    if (val == null) return undefined;

    if (typeof val === 'object') {
      const v = val as Record<string, unknown>;
      const hasLabel = typeof v.label === 'string' && v.label.trim().length > 0;
      const hasImage = typeof v.image === 'string' && v.image.trim().length > 0;

      // Treat blank / placeholder objects (e.g., { selected: false }) as undefined
      if (!hasLabel && !hasImage) return undefined;

      // Fill in defaults for real items
      return {
        name: v.name ?? '',
        label: v.label ?? '',
        image: v.image ?? '',
        breakdownNotes: v.breakdownNotes ?? '',
        wikiLink: v.wikiLink ?? '',
        selected: v.selected ?? false,
        slot: v.slot ?? undefined,
      };
    }

    return val;
  }, unionSchema);
}
