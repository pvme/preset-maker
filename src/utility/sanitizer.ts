import { EntityData } from "../types/entity-data";
import { FamiliarData } from "../types/familiar";
import { ItemData } from "../types/item-data";
import { RelicData } from "../types/relic";
import { SavedPresetData } from "../types/saved-preset-data";
import { generateDateString } from "./generate-file-name";

const DEFAULT_ENTITY_DATA: EntityData = {
  name: "",
  label: "",
  image: "",
  breakdownNotes: "",
  wikiLink: ""
};

export const sanitizeEntityData = (entityDataArr: EntityData[] | undefined) => {
  return (entityDataArr ?? []).map((entityData: EntityData) =>
    !entityData ? DEFAULT_ENTITY_DATA : entityData
  );
};
export const sanitizeRelicData = (relicDataArr: RelicData[] | undefined) : RelicData[] => {
  return (relicDataArr ?? []).map((relicData: RelicData) =>
    !relicData
      ? {
        ...DEFAULT_ENTITY_DATA,
        energy: 0
      }
     : relicData
  );
};
export const sanitizeFamiliarData = (familiarDataArr: FamiliarData[] | undefined) : FamiliarData[] => {
  return (familiarDataArr ?? []).map((familiarData: FamiliarData) =>
    !familiarData
      ? {
        ...DEFAULT_ENTITY_DATA,
      }
     : familiarData
  );
};

export const sanitizePresetData = (presetData: SavedPresetData): SavedPresetData => {
  return {
    presetName: presetData.presetName,
    inventorySlots: sanitizeEntityData(presetData.inventorySlots),
    equipmentSlots: sanitizeEntityData(presetData.equipmentSlots),
    relics: {
      primaryRelics: sanitizeRelicData(presetData.relics?.primaryRelics),
      alternativeRelics: sanitizeRelicData(presetData.relics?.alternativeRelics),
    },
    familiars: {
      primaryFamiliars: sanitizeFamiliarData(presetData.familiars?.primaryFamiliars),
      alternativeFamiliars: sanitizeFamiliarData(presetData.familiars?.alternativeFamiliars),
    }
  };
}

export const stringifyPreset = (sanitizedPresetData: SavedPresetData) => {
  const {
    presetName,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars,
  } = sanitizedPresetData;

  const { dateString, hours, minutes, seconds } = generateDateString();
  return JSON.stringify({
    presetName: presetName || `${dateString}-${hours}-${minutes}${seconds}`,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars,
  });
};

export const sanitizeAndStringifyPreset = (presetData: SavedPresetData) => {
  return stringifyPreset(sanitizePresetData(presetData));
};
