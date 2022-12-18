import { ItemData } from "./inventory-slot";

export interface ImportData {
  name: string;
  inventorySlots: ItemData[];
  equipmentSlots: ItemData[];
}
