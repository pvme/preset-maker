// src/api/get-preset.ts

import axios from "axios";
import itemData from "../data/sorted_items.json";
import { type SavedPreset as SavedPresetData } from "../schemas/saved-preset-data";
import { type Relics, type Relic as RelicData } from "../schemas/relic";
import { type Familiars, type Familiar as FamiliarData } from "../schemas/familiar";
import { type Item as ItemData } from "../schemas/item-data";

import { FunctionURLs } from './function-urls';
import { getDevHeaders } from './get-headers';

const API_URL = `${FunctionURLs.getPreset}?id=`;

interface RawStoredPreset {
  presetId: string;
  presetName: string;
  presetNotes?: string;
  inventorySlots: Array<{ label?: string; breakdownNotes?: string } | null>;
  equipmentSlots: Array<{ label?: string; breakdownNotes?: string } | null>;
  relics: Relics;
  familiars: Familiars;
}

export async function getPreset(id: string): Promise<SavedPresetData> {
  const resp = await axios.get<RawStoredPreset>(
  `${API_URL}${encodeURIComponent(id)}`,
    { headers: getDevHeaders() }
  );
  return unpackData(resp.data);
}

async function unpackData(stored: RawStoredPreset): Promise<SavedPresetData> {
  const itemMap = new Map<string, ItemData>();
  itemData.forEach((itm) => itemMap.set(itm.label, itm));

  function mapItemSlot(slot: { label?: string; breakdownNotes?: string } | null): ItemData | null {
    if (!slot || !slot.label) return null;
    const base = itemMap.get(slot.label) ?? itemMap.get("404item")!;
    const result: ItemData = { ...base };
    if (slot.breakdownNotes) result.breakdownNotes = slot.breakdownNotes;
    return result;
  }

  function blankItem(): ItemData {
    return { name: "", label: "", image: "", breakdownNotes: "", wikiLink: "" };
  }

  function mapRelicSlot(slot: RelicData | null): RelicData | null {
    if (!slot || !slot.label) return null;
    return {
      label: slot.label,
      name: slot.name,
      image: slot.image,
      breakdownNotes: slot.breakdownNotes || "",
      energy: slot.energy ?? 0,
      description: slot.description || ""
    };
  }

  function blankRelic(): RelicData {
    return { label: "", name: "", image: "", breakdownNotes: "", energy: 0, description: "" };
  }

  function mapFamiliarSlot(slot: FamiliarData | null): FamiliarData | null {
    if (!slot || !slot.label) return null;
    return {
      label: slot.label,
      name: slot.name,
      image: slot.image,
      breakdownNotes: slot.breakdownNotes || ""
    };
  }

  function blankFamiliar(): FamiliarData {
    return { label: "", name: "", image: "", breakdownNotes: "" };
  }

  const inventorySlots: ItemData[] = Array.from({ length: 28 }).map((_, i) =>
    mapItemSlot(stored.inventorySlots?.[i] ?? null) ?? blankItem()
  );

  const equipmentSlots: ItemData[] = Array.from({ length: 13 }).map((_, i) =>
    mapItemSlot(stored.equipmentSlots?.[i] ?? null) ?? blankItem()
  );

  const primaryRelics: RelicData[] = Array.from({ length: 3 }).map((_, i) =>
    mapRelicSlot(stored.relics?.primaryRelics?.[i] ?? null) ?? blankRelic()
  );

  const alternativeRelics: RelicData[] = (stored.relics?.alternativeRelics || [])
    .map(mapRelicSlot)
    .filter((r): r is RelicData => r !== null);

  const primaryFamiliars: FamiliarData[] = [
    mapFamiliarSlot(stored.familiars?.primaryFamiliars?.[0] ?? null) ?? blankFamiliar()
  ];

  const alternativeFamiliars: FamiliarData[] = (stored.familiars?.alternativeFamiliars || [])
    .map(mapFamiliarSlot)
    .filter((f): f is FamiliarData => f !== null);

  return {
    presetId:       stored.presetId,
    presetName:     stored.presetName,
    presetNotes:    stored.presetNotes || "",
    inventorySlots,
    equipmentSlots,
    relics: {
      primaryRelics,
      alternativeRelics
    },
    familiars: {
      primaryFamiliars,
      alternativeFamiliars
    }
  };
}

