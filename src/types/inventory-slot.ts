export interface ItemData {
  label: string;
  image: string;
  name: string;
  selected?: boolean;
}

export type ItemDataArray = ItemData[] | null;
