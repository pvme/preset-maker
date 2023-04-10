import { type EntityData } from './entity-data';

export interface RelicData extends EntityData {
  energy: number
};

export interface Relics {
  primaryRelics: RelicData[]
  alternativeRelics: RelicData[]
};
