import { type EntityData } from '../types/entity-data';
import { type FamiliarData, type Familiars } from '../types/familiar';
import { type ItemData } from '../types/item-data';
import { type RelicData, type Relics } from '../types/relic';
import { type SavedPresetData } from '../types/saved-preset-data';
import { generateDateString } from './generate-file-name';

const DEFAULT_ENTITY_DATA: EntityData = {
  name: '',
  label: '',
  image: '',
  breakdownNotes: '',
  wikiLink: ''
};

export const sanitizeEntityData = (entityDataArr: EntityData[] | undefined): EntityData[] => {
  return (entityDataArr ?? []).map((entityData?: EntityData) =>
    (entityData === null || entityData === undefined) ? DEFAULT_ENTITY_DATA : entityData
  );
};
export const sanitizeRelicData = (relicDataArr: RelicData[] | undefined): RelicData[] => {
  return (relicDataArr ?? []).map((relicData?: RelicData) =>
    (relicData === null || relicData === undefined)
      ? {
          ...DEFAULT_ENTITY_DATA,
          energy: 0
        }
      : relicData
  );
};
export const sanitizeFamiliarData = (familiarDataArr: FamiliarData[] | undefined): FamiliarData[] => {
  return (familiarDataArr ?? []).map((familiarData?: FamiliarData) =>
    (familiarData === null || familiarData === undefined)
      ? {
          ...DEFAULT_ENTITY_DATA
        }
      : familiarData
  );
};

export const sanitizePresetData = (presetData: SavedPresetData): SavedPresetData => {
  return {
    presetId: presetData.presetId,
    presetName: presetData.presetName,
    presetNotes: presetData.presetNotes,
    inventorySlots: sanitizeEntityData(presetData.inventorySlots),
    equipmentSlots: sanitizeEntityData(presetData.equipmentSlots),
    relics: {
      primaryRelics: sanitizeRelicData(presetData.relics?.primaryRelics),
      alternativeRelics: sanitizeRelicData(presetData.relics?.alternativeRelics)
    },
    familiars: {
      primaryFamiliars: sanitizeFamiliarData(presetData.familiars?.primaryFamiliars),
      alternativeFamiliars: sanitizeFamiliarData(presetData.familiars?.alternativeFamiliars)
    },
    presetImage: presetData.presetImage ?? undefined
  };
};

export const stringifyPreset = (sanitizedPresetData: SavedPresetData): string => {
  const {
    presetName,
    presetNotes,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars,
    presetImage
  } = sanitizedPresetData;

  const { dateString, hours, minutes, seconds } = generateDateString();
  return JSON.stringify({
    presetName: presetName ?? `${dateString}-${hours}-${minutes}${seconds}`,
    presetNotes,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars,
    presetImage
  });
};

export const stringifyData = (
  presetName: string,
  presetNotes: string,
  inventoryData: ItemData[],
  equipmentData: ItemData[],
  relicData: Relics,
  familiarData: Familiars,
  presetImage: string
): string => {
  const { dateString, hours, minutes, seconds } = generateDateString();
  const presetNameToUse = presetName.length > 0
    ? presetName
    : `${dateString}-${hours}-${minutes}${seconds}`;
  return JSON.stringify({
    presetName: presetNameToUse,
    presetNotes,
    inventorySlots: inventoryData,
    equipmentSlots: equipmentData,
    relics: relicData,
    familiars: familiarData,
    presetImage
  });
};

export const sanitizeAndStringifyPreset = (presetData: SavedPresetData): string => {
  return stringifyPreset(sanitizePresetData(presetData));
};
