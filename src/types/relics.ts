import { EntityData } from "./entity-data";

export interface RelicData extends EntityData {
  // Nothing yet.
};

export interface Relics {
  primaryRelics: RelicData[];
  alternativeRelics: RelicData[];
};
