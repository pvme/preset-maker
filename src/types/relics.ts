export interface RelicData {
  label: string;
  image: string;
  name: string;
  breakdownNotes?: string;
  selected?: boolean;
};

export interface Relics {
  primaryRelics: RelicData[];
  alternativeRelics: RelicData[];
};
