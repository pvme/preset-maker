import axios from 'axios';

import { type SavedPresetData } from '../types/saved-preset-data';
import itemData from '../data/sorted_items.json';
import { type Relics } from '../types/relic';
import { type Familiars } from '../types/familiar';

const apiUrl =
  'https://us-central1-pvmebackend.cloudfunctions.net/getPreset?id=';

export const getPreset = async (id: string): Promise<SavedPresetData> => {
  const response = await axios.get(`${apiUrl}${id}`);
  const storedPreset = response.data;
  const unpackedPreset = await unpackData(storedPreset);
  return unpackedPreset;
};

const unpackData = async (stored: {
  equipmentSlots: any
  presetName: any
  presetNotes: string
  inventorySlots: string | any[]
  relics: Relics
  familiars: Familiars
}): Promise<SavedPresetData> => {
  const newPreset: SavedPresetData = {
    presetName: stored.presetName,
    presetNotes: stored.presetNotes,
    inventorySlots: [],
    equipmentSlots: [],
    relics: { primaryRelics: [], alternativeRelics: [] },
    familiars: { primaryFamiliars: [], alternativeFamiliars: [] }
  };

  // create a map of all item labels to their default object
  const itemDataMap = new Map();
  itemData.forEach((element) => {
    itemDataMap.set(element.label, element);
  });

  // loop stored preset inventory items
  for (let i = 0; i < stored.inventorySlots.length; i++) {
    const itemLabel = stored.inventorySlots[i].label;
    let defaultItem = { ...itemDataMap.get(itemLabel) }; //returns an empty object {} if item label not found
    if(Object.keys(defaultItem).length < 1 && itemLabel != "") { //no item found for given label
      defaultItem = { ...itemDataMap.get("404item") };  //get the 404 item
      defaultItem.breakdownNotes = `Stored preset has item: ${stored.inventorySlots[i].label} which was not found by the Preset Maker.`;
    }
    else if (stored.inventorySlots[i].breakdownNotes !== '') { //only load stored notes if default item was found
      defaultItem.breakdownNotes = stored.inventorySlots[i].breakdownNotes;
    }
    newPreset.inventorySlots[i] = defaultItem;
  }

  // loop stored equipment items
  for (let i = 0; i < stored.equipmentSlots.length; i++) {
    const itemLabel = stored.equipmentSlots[i].label;
    let defaultItem = { ...itemDataMap.get(itemLabel) }; //returns an empty object {} if item label not found
    if(Object.keys(defaultItem).length < 1 && itemLabel != "") { //no item found for given label
      defaultItem = { ...itemDataMap.get("404item") };  //get the 404 item
      defaultItem.breakdownNotes = `Stored preset has item: ${stored.equipmentSlots[i].label} which was not found by the Preset Maker.`;
    }
    else if (stored.equipmentSlots[i].breakdownNotes !== '') { //only load stored notes if default item was found
      defaultItem.breakdownNotes = stored.equipmentSlots[i].breakdownNotes;
    }
    newPreset.equipmentSlots[i] = defaultItem;
  }

  // TODO map stored relic data to latest
  // temp, for now just assign it
  newPreset.relics = stored.relics;
  // TODO map stored familiar data to latest
  // temp, for now just assign it
  newPreset.familiars = stored.familiars;

  return newPreset;
};
