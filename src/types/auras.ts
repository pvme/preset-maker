export interface AuraData {
  label: string;
  image: string;
  name: string;
  breakdownNotes?: string;
  selected?: boolean;
};

export interface Auras {
  primaryAuras: AuraData[];
  alternativeAuras: AuraData[];
};
