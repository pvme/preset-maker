import { ItemData } from "../types/inventory-slot";
import { generateDateString } from "./generate-file-name";

export const sanitizedData = (inventoryData: ItemData[], equipmentData: ItemData[]) => {
  // ensure that no values can be null
  const inventory = inventoryData.map((item: ItemData) => (!item ? { name: "", label: "", image: "" } : item));
  const equipment = equipmentData.map((item: ItemData) => (!item ? { name: "", label: "", image: "" } : item));
  return { inventory, equipment };
};

export const stringifyData = (presetName: string, inventoryData: ItemData[], equipmentData: ItemData[]) => {
  const { dateString, hours, minutes, seconds } = generateDateString();
  return JSON.stringify({
    presetName: presetName || `${dateString}-${hours}-${minutes}${seconds}`,
    inventorySlots: inventoryData,
    equipmentSlots: equipmentData,
  });
};
