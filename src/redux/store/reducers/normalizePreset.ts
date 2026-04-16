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
    if (index === 11) return null;
    if (index > 11) return index - 1;
    return index;
  }

  function migrateLegacyBreakdown(rawInput: any): BreakdownEntry[] {
    if (Array.isArray(rawInput?.breakdown) && rawInput.breakdown.length > 0) {
      return rawInput.breakdown.flatMap((entry: any) => {
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

    rawInput?.inventorySlots?.forEach((slot: any, index: number) => {
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

    rawInput?.equipmentSlots?.forEach((slot: any, index: number) => {
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

  function migrateSlotArray(input: any, max?: number) {
    const arr = Array.isArray(input) ? input.map(migrateSlot) : [];
    return typeof max === "number" ? arr.slice(0, max) : arr;
  }

  const rawEquipmentSlots: any[] = Array.isArray(raw?.equipmentSlots)
    ? raw.equipmentSlots
    : [];

  const migratedEquipmentSlots = rawEquipmentSlots
    .map(migrateSlot)
    .filter((_, index: number) => migrateEquipmentSlotIndex(index) !== null);

  const legacyPrimaryFamiliar = Array.isArray(raw?.familiars?.primaryFamiliars)
    ? raw.familiars.primaryFamiliars[0]
    : undefined;

  const legacyPrimaryRelics = Array.isArray(raw?.relics?.primaryRelics)
    ? raw.relics.primaryRelics
    : [];

  const migrated = {
    presetName: raw?.presetName,
    presetNotes: raw?.presetNotes,

    inventorySlots: Array.isArray(raw?.inventorySlots)
      ? raw.inventorySlots.map(migrateSlot)
      : [],

    equipmentSlots: migratedEquipmentSlots,

    familiar: raw?.familiar
      ? migrateSlot(raw.familiar)
      : legacyPrimaryFamiliar
        ? migrateSlot(legacyPrimaryFamiliar)
        : { id: "" },

    relics:
      Array.isArray(raw?.relics) && !raw?.relics?.primaryRelics
        ? migrateSlotArray(raw.relics, 3)
        : migrateSlotArray(legacyPrimaryRelics, 3),

    aspect: raw?.aspect ? migrateSlot(raw.aspect) : { id: "" },

    ammoSpells: migrateSlotArray(raw?.ammoSpells, 3),

    breakdown: migrateLegacyBreakdown(raw),
  };

  return presetSchema.parse(migrated);
}
