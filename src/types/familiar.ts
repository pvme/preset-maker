import { type EntityData } from './entity-data';

export interface FamiliarData extends EntityData {
  // Nothing yet.
};

export interface Familiars {
  primaryFamiliars: FamiliarData[]
  alternativeFamiliars: FamiliarData[]
};
