// src/schemas/util.ts
import { z } from 'zod';

export enum PrimaryOrAlternative {
  None,
  Primary,
  Alternative
};

export interface IndexedSelection {
  primaryOrAlternative: PrimaryOrAlternative
  index: number
}

export function makeMaybe<T extends z.ZodTypeAny>(base: T) {
  const unionSchema = z.union([base, z.null(), z.undefined()]);
  return z.preprocess((val) => {
    if (val == null) return undefined;
    if (
      typeof val === 'object' &&
      // @ts-ignore
      !(val.label?.length) &&
      // @ts-ignore
      !(val.image?.length)
    ) {
      return undefined;
    }
    return val;
  }, unionSchema);
}
