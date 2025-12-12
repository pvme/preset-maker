// src/schemas/relic.ts

export interface Relic {
  id: string;
}

export interface Relics {
  primaryRelics: Relic[];
  alternativeRelics: Relic[];
}
