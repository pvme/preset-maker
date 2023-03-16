export interface ItemData {
  label: string;
  image: string;
  name: string;
  selected?: boolean;
  // TODO: link the breakdown notes to the item data
  breakdownNotes?: string;
}

export type ItemDataArray = ItemData[] | null;
