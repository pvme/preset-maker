export interface FamiliarData {
  label: string;
  image: string;
  name: string;
  breakdownNotes?: string;
  selected?: boolean;
};

export interface Familiars {
  primaryFamiliars: FamiliarData[];
  alternativeFamiliars: FamiliarData[];
};
