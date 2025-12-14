// src/schemas/familiar.ts

export interface Familiar {
  id: string;
}

export interface Familiars {
  primaryFamiliars: Familiar[];
  alternativeFamiliars: Familiar[];
}
