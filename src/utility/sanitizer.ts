import { ItemData } from "../types/inventory-slot";

export const sanitizedData = (inventoryData: ItemData[], equipmentData: ItemData[]) => {
  // ensure that no values can be null
  const inventory = inventoryData.map((item: ItemData) => (!item ? { name: "", label: "", image: "" } : item));
  const equipment = equipmentData.map((item: ItemData) => (!item ? { name: "", label: "", image: "" } : item));
  return { inventory, equipment };
};

export const stringifyData = (presetName: string, inventoryData: ItemData[], equipmentData: ItemData[]) =>
  JSON.stringify({
    presetName,
    inventorySlots: inventoryData,
    equipmentSlots: equipmentData,
  });
