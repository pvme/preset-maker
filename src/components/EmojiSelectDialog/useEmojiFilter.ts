// src/components/EmojiSelectDialog/useEmojiFilter.ts

import { useCallback, useMemo } from "react";
import fuzzysort from "fuzzysort";

import { SlotType } from "../../schemas/slot-type";
import type { EmojiEntry, EmojiMaps } from "../../emoji/types";
import {
  UI_TO_PRESET_SLOT,
  UI_TO_EQUIPMENT_SLOT_LABEL,
} from "../PresetEditor/equipmentSlots";

interface Params {
  maps: EmojiMaps | null;
  slotType: SlotType | "relic" | "familiar";
  slotIndex: number; // UI equipment index (0–12)
  selectedIndices: string[];
  slotKey: string;
}

export const useEmojiFilter = ({ maps, slotType, slotIndex }: Params) => {
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
        //
        if (slotType === SlotType.Inventory) {
          if (e.preset_slot === 8) return false; // no auras
          if (e.preset_type === "relic") return false; // no relics
          return true;
        }

        //
        // EQUIPMENT:
        // strict match: preset_slot === mapped slot
        //
        if (slotType === SlotType.Equipment) {
          const expectedPresetSlot = UI_TO_PRESET_SLOT[slotIndex];
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
        keys: ["name", "id", "id_aliases"],
        limit: 100,
        threshold: -100,
      });

      return results.map((r: any) => ({ id: r.obj.id }));
    },
    [maps],
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
        if (e.preset_slot === 8) return false; // no auras
        if (e.preset_type === "relic") return false; // no relics
        return true;
      }

      if (slotType === SlotType.Equipment) {
        const expectedPresetSlot = UI_TO_PRESET_SLOT[slotIndex];
        return e.preset_slot === expectedPresetSlot;
      }

      return false;
    },
    [maps, slotType, slotIndex],
  );

  //
  // Title text
  //
  const dialogTitle = useMemo(() => {
    if (slotType === "relic") return "Select relic";
    if (slotType === "familiar") return "Select familiar";
    if (slotType === SlotType.Equipment) {
      const label = UI_TO_EQUIPMENT_SLOT_LABEL[slotIndex];
      return label ? `Select ${label} slot` : "Select worn slot";
    }
    return "Select backpack item";
  }, [slotType, slotIndex]);

  return {
    ready: !!maps,
    options,
    filterOptions,
    filterRecent,
    dialogTitle,
  };
};
