import { Familiars } from "./familiar";
import { ItemData } from "./inventory-slot";
import { Relics } from "./relics";

export interface ImportData {
  presetName: string;
  inventorySlots: ItemData[];
  equipmentSlots: ItemData[];
  relics?: Relics;
  familiars?: Familiars;
}
