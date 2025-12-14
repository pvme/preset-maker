// src/components/PresetSection/presetSectionApi.ts

import axios from "axios";
import { type SavedPreset as SavedPresetData } from "../../schemas/saved-preset-data";
import { loadEmojis } from "../../emoji";

const apiUrl =
  "https://us-central1-pvmebackend.cloudfunctions.net/getPreset?id=";

export const GetPreset = async (id: string): Promise<SavedPresetData> => {
  const response = await axios.get(`${apiUrl}${id}`);
  return await unpackData(response.data);
};

const unpackData = async (stored: any): Promise<SavedPresetData> => {
  const emojis = await loadEmojis();

  const convertSlot = (slot: any) => {
    if (!slot) return { id: "" };

    const raw =
      slot?.id ??
      slot?.label ??    // legacy
      slot?.name ??     // legacy
      slot ??           // string fallback
      "";

    const resolved = emojis.resolve(raw.toString().toLowerCase());
    return { id: resolved };
  };

  return {
    presetName: stored.presetName ?? "",
    presetNotes: stored.presetNotes ?? "",

    inventorySlots: (stored.inventorySlots ?? []).map(convertSlot),
    equipmentSlots: (stored.equipmentSlots ?? []).map(convertSlot),

    familiars: {
      primaryFamiliars: (stored.familiars?.primaryFamiliars ?? []).map(convertSlot),
      alternativeFamiliars: (stored.familiars?.alternativeFamiliars ?? []).map(convertSlot),
    },

    relics: {
      primaryRelics: (stored.relics?.primaryRelics ?? []).map(convertSlot),
      alternativeRelics: (stored.relics?.alternativeRelics ?? []).map(convertSlot),
    },

    breakdown: stored.breakdown ?? [],
  };
};
