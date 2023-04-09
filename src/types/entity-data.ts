/**
 * An entity can be an inventory item, equipped item, an aura, or a relic.
 */
export interface EntityData {
  /**
   * Label for HTML elements.
   */
  label: string
  /**
   * URL for the image associated with this entity.
   */
  image: string
  /**
   * Human-readable name of the entity.
   */
  name: string

  /**
   * Optional fields.
   * New fields should be added here for backwards compatibility.
   */

  /**
   * Human-readable notes assoiated with the entity.
   */
  breakdownNotes?: string
  /**
   * Link to RS Wiki.
   */
  wikiLink?: string
};
