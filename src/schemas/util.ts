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
 * - empty or partial objects → filled with default values
 * - valid objects → passed through unchanged
 */
export function makeMaybe<T extends z.ZodTypeAny>(base: T) {
  return z.preprocess((val) => {
    if (val == null) return undefined;

    if (typeof val === 'object') {
      const v = val as Record<string, unknown>;
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
  }, z.union([base, z.undefined()]));
}
