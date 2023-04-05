import { Familiars } from "./familiar";
import { ItemData } from "./item-data";
import { Relics } from "./relics";

export interface ImportData {
  presetName: string;
  inventorySlots: ItemData[];
  equipmentSlots: ItemData[];

  /**
   * Optional fields below.
   * New fields should be added here for backwards compatibility.
   */

  relics?: Relics;
  familiars?: Familiars;
}
