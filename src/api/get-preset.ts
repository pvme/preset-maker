import axios from "axios";

import { SavedPresetData } from "../types/saved-preset-data";
import itemData from "../data/sorted_items.json";
import { Relics } from "../types/relic";
import { Familiars } from "../types/familiar";

const apiUrl =
  "https://us-central1-pvmebackend.cloudfunctions.net/getPreset?id=";

export const getPreset = async (id: string) => {
  const response = await axios.get(`${apiUrl}${id}`);
  const storedPreset = response.data;
  let unpackedPreset = await unpackData(storedPreset);
  return unpackedPreset;
};

const unpackData = async (stored: {
  equipmentSlots: any;
  presetName: any;
  inventorySlots: string | any[];
  relics: Relics;
  familiars: Familiars;
}): Promise<SavedPresetData> => {
  let newPreset: SavedPresetData = {
    presetName: "",
    inventorySlots: [],
    equipmentSlots: [],
    relics: { primaryRelics: [], alternativeRelics: [] },
    familiars: { primaryFamiliars: [], alternativeFamiliars: [] },
  };

  // create a map of all item labels to their default object
  let itemDataMap = new Map();
  await itemData.forEach((element) => {
    itemDataMap.set(element.label, element);
  });

  // loop stored preset inventory items
  for (let i = 0; i < stored.inventorySlots.length; i++) {
    let itemLabel = stored.inventorySlots[i].label;
    let defaultItem = { ...itemDataMap.get(itemLabel) };
    if (stored.inventorySlots[i].breakdownNotes !== "") {
      defaultItem.breakdownNotes = stored.inventorySlots[i].breakdownNotes;
    }
    newPreset.inventorySlots[i] = defaultItem;
  }

  // loop stored equipment items
  for (let i = 0; i < stored.equipmentSlots.length; i++) {
    let itemLabel = stored.equipmentSlots[i].label;
    let defaultItem = { ...itemDataMap.get(itemLabel) };
    if (stored.equipmentSlots[i].breakdownNotes !== "") {
      defaultItem.breakdownNotes = stored.equipmentSlots[i].breakdownNotes;
    }
    newPreset.equipmentSlots[i] = defaultItem;
  }

  //TODO map stored relic data to latest
  //temp, for now just assign it
  newPreset.relics = stored.relics;
  //TODO map stored familiar data to latest
  //temp, for now just assign it
  newPreset.familiars = stored.familiars;

  return newPreset;
};
