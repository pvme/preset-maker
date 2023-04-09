import { Familiars } from "../types/familiar";
import { ItemData } from "../types/item-data";
import { Relics } from "../types/relic";
import { generateDateString } from "./generate-file-name";

export const sanitizedData = (
  inventoryData: ItemData[],
  equipmentData: ItemData[],
  relicData: Relics,
  familiarData: Familiars
) => {
  // ensure that no values can be null
  const inventory = inventoryData.map((item: ItemData) =>
    !item ? { name: "", label: "", image: "", breakdownNotes: "" } : item
  );
  const equipment = equipmentData.map((item: ItemData) =>
    !item ? { name: "", label: "", image: "", breakdownNotes: "" } : item
  );
  //TODO santize relics here
  //temp, just assign it
  const relics = relicData;
  //TODO sanitize familiars here
  //temp, just assign it
  const familiars = familiarData;

  return { inventory, equipment, relics, familiars };
};

export const stringifyData = (
  presetName: string,
  inventoryData: ItemData[],
  equipmentData: ItemData[],
  relicData: Relics,
  familiarData: Familiars
) => {
  const { dateString, hours, minutes, seconds } = generateDateString();
  return JSON.stringify({
    presetName: presetName || `${dateString}-${hours}-${minutes}${seconds}`,
    inventorySlots: inventoryData,
    equipmentSlots: equipmentData,
    relics: relicData,
    familiars: familiarData
  });
};
