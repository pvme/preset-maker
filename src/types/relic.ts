import { type EntityData } from './entity-data';

export interface RelicData extends EntityData {
  energy?: number
  description?: string
};

export interface Relics {
  primaryRelics: RelicData[]
  alternativeRelics: RelicData[]
};
