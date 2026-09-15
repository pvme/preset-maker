import type { Pixels, Fingerprint, Template, Candidate } from "./matcher";
export function createPresetImageMatcher(): {
  size: number;
  fingerprint(pixels: Pixels, strict?: boolean, hideQuantity?: boolean): Fingerprint;
  queries(pixels: Pixels): Fingerprint[];
  rank(query: Fingerprint, entries: Template[], limit?: number): Candidate[];
  suggest(queries: Fingerprint[], entries: Template[], limit?: number): { candidates: Candidate[]; selected: string; confident: boolean };
};
