export interface ItemData {
  label: string;
  image: string;
  name: string;
  breakdownNotes: string;
  selected?: boolean;
}

export type ItemDataArray = ItemData[] | null;
