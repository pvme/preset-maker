import axios from 'axios';
import { type SavedPresetData } from '../../types/saved-preset-data';
import itemData from '../../data/sorted_items.json';

const apiUrl =
  'https://us-central1-pvmebackend.cloudfunctions.net/getPreset?id=';

export const GetPreset = async (id: string): Promise<SavedPresetData> => {
  const response = await axios.get(`${apiUrl}${id}`);
  const storedPreset = response.data;
  const unpackedPreset = await unpackData(storedPreset);
  return unpackedPreset;
};

const unpackData = async (stored: {
  equipmentSlots: any
  presetName: any
  inventorySlots: string | any[]
}): Promise<SavedPresetData> => {
  const newPreset: SavedPresetData = {
    presetName: '',
    inventorySlots: [],
    equipmentSlots: []
  };
  // create a map of all item labels to their default object
  const itemDataMap = new Map();
  itemData.forEach((element) => {
    itemDataMap.set(element.label, element);
  });

  // loop stored preset inventory items
  for (let i = 0; i < stored.inventorySlots.length; i++) {
    const itemLabel = stored.inventorySlots[i].label;
    const defaultItem = { ...itemDataMap.get(itemLabel) };
    if (stored.inventorySlots[i].breakdownNotes !== '') {
      defaultItem.breakdownNotes = stored.inventorySlots[i].breakdownNotes;
    }
    newPreset.inventorySlots[i] = defaultItem;
  }

  // loop stored equipment items
  for (let i = 0; i < stored.equipmentSlots.length; i++) {
    const itemLabel = stored.equipmentSlots[i].label;
    const defaultItem = { ...itemDataMap.get(itemLabel) };
    if (stored.equipmentSlots[i].breakdownNotes !== '') {
      defaultItem.breakdownNotes = stored.equipmentSlots[i].breakdownNotes;
    }
    newPreset.equipmentSlots[i] = defaultItem;
  }

  return newPreset;
};
