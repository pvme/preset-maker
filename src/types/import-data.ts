import { ItemData } from "./inventory-slot";

export interface ImportData {
  presetName: string;
  inventorySlots: ItemData[];
  equipmentSlots: ItemData[];
}
