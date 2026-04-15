// src/redux/store/reducers/normalizePreset.ts

import { presetSchema, type Preset } from "../../../schemas/preset";
import { loadEmojis } from "../../../emoji";
import type { z } from "zod";
import { BreakdownEntrySchema } from "../../../schemas/breakdown";

type BreakdownEntry = z.infer<typeof BreakdownEntrySchema>;

export async function normalizePreset(raw: any): Promise<Preset> {
  const emojis = await loadEmojis();
  const usesLegacyAuraLayout =
    Array.isArray(raw?.equipmentSlots) && raw.equipmentSlots.length >= 13;

  function migrateEquipmentSlotIndex(index: number): number | null {
    if (!usesLegacyAuraLayout) return index;

    // Legacy layout:
    // 0..10 unchanged, 11 = aura (drop), 12 = pocket -> 11
    if (index === 11) return null;
    if (index > 11) return index - 1;
    return index;
  }

  function migrateLegacyBreakdown(raw: any): BreakdownEntry[] {
    if (Array.isArray(raw?.breakdown) && raw.breakdown.length > 0) {
      return raw.breakdown.flatMap((entry: any) => {
        if (entry?.slotType !== "equipment") {
          return [entry];
        }

        const nextIndex = migrateEquipmentSlotIndex(entry.slotIndex);
        if (nextIndex === null) return [];

        return [
          {
            ...entry,
            slotIndex: nextIndex,
          },
        ];
      });
    }

    const breakdown: BreakdownEntry[] = [];

    raw?.inventorySlots?.forEach((slot: any, index: number) => {
      if (
        typeof slot?.breakdownNotes === "string" &&
        slot.breakdownNotes.trim()
      ) {
        breakdown.push({
          slotType: "inventory",
          slotIndex: index,
          description: slot.breakdownNotes,
        });
      }
    });

    raw?.equipmentSlots?.forEach((slot: any, index: number) => {
      const nextIndex = migrateEquipmentSlotIndex(index);
      if (nextIndex === null) return;

      if (
        typeof slot?.breakdownNotes === "string" &&
        slot.breakdownNotes.trim()
      ) {
        breakdown.push({
          slotType: "equipment",
          slotIndex: nextIndex,
          description: slot.breakdownNotes,
        });
      }
    });

    return breakdown;
  }

  function migrateSlot(slot: any) {
    const rawId =
      slot?.id ?? slot?.label ?? (typeof slot === "string" ? slot : "");

    if (!rawId || typeof rawId !== "string") {
      return { id: "" };
    }

    const resolved = emojis.resolve(rawId.toLowerCase());
    return { id: resolved ?? "" };
  }

  const rawEquipmentSlots: any[] = Array.isArray(raw?.equipmentSlots)
    ? raw.equipmentSlots
    : [];

  const migratedEquipmentSlots = rawEquipmentSlots
    .map(migrateSlot)
    .filter((slot, index: number) => migrateEquipmentSlotIndex(index) !== null);

  const migrated = {
    presetName: raw?.presetName,
    presetNotes: raw?.presetNotes,

    inventorySlots: Array.isArray(raw?.inventorySlots)
      ? raw.inventorySlots.map(migrateSlot)
      : [],

    equipmentSlots: migratedEquipmentSlots,

    relics: {
      primaryRelics: Array.isArray(raw?.relics?.primaryRelics)
        ? raw.relics.primaryRelics.map(migrateSlot)
        : [],
      alternativeRelics: Array.isArray(raw?.relics?.alternativeRelics)
        ? raw.relics.alternativeRelics.map(migrateSlot)
        : [],
    },

    familiars: {
      primaryFamiliars: Array.isArray(raw?.familiars?.primaryFamiliars)
        ? raw.familiars.primaryFamiliars.map(migrateSlot)
        : [],
      alternativeFamiliars: Array.isArray(raw?.familiars?.alternativeFamiliars)
        ? raw.familiars.alternativeFamiliars.map(migrateSlot)
        : [],
    },

    breakdown: migrateLegacyBreakdown(raw),
  };

  return presetSchema.parse(migrated);
}
