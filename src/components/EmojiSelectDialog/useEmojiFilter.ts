// src/components/EmojiSelectDialog/useEmojiFilter.ts

import { useCallback, useMemo } from "react";
import fuzzysort from "fuzzysort";

import { SlotType } from "../../schemas/slot-type";
import type { EmojiEntry, EmojiMaps } from "../../emoji/types";

interface Params {
  maps: EmojiMaps | null;
  slotType: SlotType | "relic" | "familiar";
  slotIndex: number;       // UI equipment index (0–12)
  selectedIndices: string[];
  slotKey: string;
}

//
// UI → preset_slot mapping
//

const uiToPresetSlot: number[] = [
  1,   // UI 0 → HELM
  12,  // UI 1 → CAPE
  10,  // UI 2 → NECKLACE
  4,   // UI 3 → MH_WEAPON
  2,   // UI 4 → BODY
  5,   // UI 5 → OH_WEAPON
  3,   // UI 6 → LEGS
  6,   // UI 7 → GLOVES
  7,   // UI 8 → BOOTS
  11,  // UI 9 → RING
  9,   // UI 10 → AMMO
  8,   // UI 11 → AURA
  13,  // UI 12 → POCKET
];

export const useEmojiFilter = ({
  maps,
  slotType,
  slotIndex,
}: Params) => {

  //
  // Full emoji list
  //
  const all: EmojiEntry[] = useMemo(() => {
    if (!maps) return [];
    return Object.values(maps.byId);
  }, [maps]);

  //
  // Filtering core rules
  //
  const options = useMemo<{ id: string }[]>(() => {
    if (!maps) return [];

    return all
      .filter((e) => {
        //
        // RELICS
        //
        if (slotType === "relic") {
          return e.preset_type === "relic";
        }

        //
        // FAMILIARS
        //
        if (slotType === "familiar") {
          return e.preset_type === "familiar";
        }

        //
        // INVENTORY:
        // includes everything EXCEPT:
        //   - aura slot items (preset_slot = 8)
        //   - relics
        //   - familiars
        //
        if (slotType === SlotType.Inventory) {
          if (e.preset_slot === 8) return false;        // no aura
          if (e.preset_type === "relic") return false;
          if (e.preset_type === "familiar") return false;
          return true;
        }

        //
        // EQUIPMENT:
        // strict match: preset_slot === mapped slot
        //
        if (slotType === SlotType.Equipment) {
          const expectedPresetSlot = uiToPresetSlot[slotIndex];
          return e.preset_slot === expectedPresetSlot;
        }

        return false;
      })
      .map((e) => ({ id: e.id }));
  }, [maps, all, slotType, slotIndex]);

  //
  // Fuzzy filtering
  //
  const filterOptions = useCallback(
    (opts: { id: string }[], state: { inputValue: string }) => {
      if (!maps) return opts;
      if (!state.inputValue) return opts;

      const enriched = opts.map((o) => ({
        ...o,
        name: maps.get(o.id)?.name ?? "",
      }));

      const results = fuzzysort.go(state.inputValue, enriched, {
        keys: ["name"],
        limit: 100,
        threshold: -100,
      });

      return results.map((r: any) => ({ id: r.obj.id }));
    },
    [maps]
  );

  //
  // Recent items filtering
  //
  const filterRecent = useCallback(
    (id: string) => {
      if (!maps) return false;
      const e = maps.get(id);
      if (!e) return false;

      if (slotType === "relic") return e.preset_type === "relic";
      if (slotType === "familiar") return e.preset_type === "familiar";

      if (slotType === SlotType.Inventory) {
        if (e.preset_slot === 8) return false; // aura
        if (e.preset_type === "relic") return false;
        if (e.preset_type === "familiar") return false;
        return true;
      }

      if (slotType === SlotType.Equipment) {
        const expectedPresetSlot = uiToPresetSlot[slotIndex];
        return e.preset_slot === expectedPresetSlot;
      }

      return false;
    },
    [maps, slotType, slotIndex]
  );

  //
  // Title text
  //
  const dialogTitle = useMemo(() => {
    if (slotType === "relic") return "Choose a relic";
    if (slotType === "familiar") return "Choose a familiar";
    return "Choose an item";
  }, [slotType]);

  return {
    ready: !!maps,
    options,
    filterOptions,
    filterRecent,
    dialogTitle,
  };
};
