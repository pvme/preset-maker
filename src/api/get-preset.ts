// src/api/get-preset.ts

import axios from "axios";
import itemData from "../data/sorted_items.json";
import { type SavedPresetData } from "../types/saved-preset-data";
import { type Relics, type RelicData } from "../types/relic";
import { type Familiars, type FamiliarData } from "../types/familiar";
import { type ItemData } from "../types/item-data";

const {
  VITE_FIREBASE_EMULATOR_HOST,
  VITE_FIREBASE_PROJECT_ID,
  VITE_API_BASE_URL,
} = import.meta.env;

// pick the right base URL for emulator vs production
const BASE =
  import.meta.env.DEV && VITE_FIREBASE_EMULATOR_HOST && VITE_FIREBASE_PROJECT_ID
    ? `http://${VITE_FIREBASE_EMULATOR_HOST}/${VITE_FIREBASE_PROJECT_ID}/us-central1`
    : VITE_API_BASE_URL;

const API_URL = `${BASE}/getPreset?id=`;

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
    `${API_URL}${encodeURIComponent(id)}`
  );
  return unpackData(resp.data);
}

async function unpackData(stored: RawStoredPreset): Promise<SavedPresetData> {
  // build the item lookup
  const itemMap = new Map<string, ItemData>();
  itemData.forEach((itm) => itemMap.set(itm.label, itm));

  // --- Helpers for inventory/equipment slots ---
  function mapItemSlot(
    slot: { label?: string; breakdownNotes?: string } | null
  ): ItemData | null {
    if (!slot || !slot.label) return null;
    const base = itemMap.get(slot.label) ?? itemMap.get("404item")!;
    const result: ItemData = { ...base };
    if (slot.breakdownNotes) result.breakdownNotes = slot.breakdownNotes;
    return result;
  }
  function blankItem(): ItemData {
    return { name: "", label: "", image: "", breakdownNotes: undefined, wikiLink: "" };
  }

  // --- Helpers for relics ---
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

  // --- Helpers for familiars ---
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

  // --- Fixed‐length inventory / equipment ---
  const inventorySlots: ItemData[] = Array.from({ length: 28 }).map((_, i) =>
    mapItemSlot(stored.inventorySlots[i] ?? null) ?? blankItem()
  );
  const equipmentSlots: ItemData[] = Array.from({ length: 13 }).map((_, i) =>
    mapItemSlot(stored.equipmentSlots[i] ?? null) ?? blankItem()
  );

  // --- Primary relics: exactly 3 slots ---
  const primaryRelics: RelicData[] = Array.from({ length: 3 }).map((_, i) =>
    mapRelicSlot(stored.relics.primaryRelics[i] ?? null) ?? blankRelic()
  );

  // --- Alternative relics: as many as the stored array ---
  const alternativeRelics: RelicData[] = (stored.relics.alternativeRelics || [])
    .map(mapRelicSlot)
    .filter((r): r is RelicData => r !== null);

  // --- Primary familiars: exactly 1 slot ---
  const primaryFamiliars: FamiliarData[] = [
    mapFamiliarSlot(stored.familiars.primaryFamiliars[0] ?? null) ?? blankFamiliar(),
  ];

  // --- Alternative familiars: as many as the stored array ---
  const alternativeFamiliars: FamiliarData[] = (stored.familiars.alternativeFamiliars || [])
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
      alternativeRelics,
    },
    familiars: {
      primaryFamiliars,
      alternativeFamiliars,
    },
  };
}
