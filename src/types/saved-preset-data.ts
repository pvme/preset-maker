import { Familiars } from "./familiar";
import { ItemData } from "./item-data";
import { Relics } from "./relic";

/**
 * Represents saved data for a preset, both in localStorage and on the backend.
 */
export interface SavedPresetData {
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
