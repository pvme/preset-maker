import { type EntityData } from './entity-data';

export interface ItemData extends EntityData {
  /**
   * Optional fields.
   * New fields should be added here for backwards compatibility.
   */
  selected?: boolean
  slot?: number
}
