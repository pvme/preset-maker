import { type Coord } from "../schemas/coord";

const createGridCoords = (
  startX: number,
  startY: number,
  columns: number,
  rows: number,
  stepX: number,
  stepY: number,
): Coord[] =>
  Array.from({ length: rows * columns }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);

    return {
      x: startX + column * stepX,
      y: startY + row * stepY,
    };
  });

export const SLOT_METRICS = {
  inventory: {
    width: 38,
    height: 34,
  },

  equipment: {
    width: 32,
    height: 34,
  },
} as const;

/* Desktop layout */
export const inventoryCoords: Coord[] = createGridCoords(
  7, // startX
  7, // startY
  7, // columns
  4, // rows
  44, // stepX
  36, // stepY
);

export const equipmentCoords: Coord[] = createGridCoords(
  334, // startX
  7, // startY
  3, // columns
  4, // rows
  49, // stepX
  38, // stepY
);

/* Mobile layout */
export const inventoryCoordsMobile: Coord[] = createGridCoords(
  7,
  4,
  4,
  7,
  46,
  37,
);

export const equipmentCoordsMobile: Coord[] = [
  // Helm
  { x: 85, y: 280 },

  // Cape
  { x: 45, y: 320 },

  // Necklace
  { x: 85, y: 320 },

  // Mainhand
  { x: 25, y: 360 },

  // Chest
  { x: 85, y: 360 },

  // Shield
  { x: 145, y: 360 },

  // Legs
  { x: 85, y: 400 },

  // Gloves
  { x: 25, y: 440 },

  // Boots
  { x: 85, y: 440 },

  // Ring
  { x: 145, y: 440 },

  // Ammo/rune pouch
  { x: 125, y: 320 },

  // Pocket slot
  { x: 125, y: 280 },
];
