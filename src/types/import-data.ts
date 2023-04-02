import { Auras } from "./auras";
import { ItemData } from "./inventory-slot";
import { Relics } from "./relics";

export interface ImportData {
  presetName: string;
  inventorySlots: ItemData[];
  equipmentSlots: ItemData[];
  relics?: Relics;
  auras?: Auras;
}
