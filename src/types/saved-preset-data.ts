// src/types/saved-preset-data.ts

import { ItemData } from './item-data';
import { Relics }   from './relic';
import { Familiars } from './familiar';

/**
 * A preset that lives in either localStorage or comes
 * back from the server. All arrays are exact lengths—
 * empty slots are represented by an "empty" ItemData.
 */
export interface SavedPresetData {
  /** Populated by the server; absent on brand-new local saved */
  presetId?: string;

  presetName:   string;
  /** optional in both cases */
  presetNotes?: string;

  /** Always length 28 */
  inventorySlots:  ItemData[];
  /** Always length 13 */
  equipmentSlots:  ItemData[];

  relics?:    Relics;
  familiars?: Familiars;

  /** Only used by share-link flow; not persisted server-side */
  presetImage?: string;
}
