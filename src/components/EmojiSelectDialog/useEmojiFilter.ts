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
  slotType: SlotType;
  slotIndex: number;
  selectedIndices: string[];
  slotKey: string;
}

const AURA_PRESET_SLOT = 8;
const AMMO_PRESET_SLOT = 9;

const MAX_VISIBLE_OPTIONS = 50;

export const useEmojiFilter = ({ maps, slotType, slotIndex }: Params) => {
  const all: EmojiEntry[] = useMemo(() => {
    if (!maps) return [];
    return Object.values(maps.byId).filter(
      (entry, index, arr) => arr.findIndex((e) => e.id === entry.id) === index,
    );
  }, [maps]);

  const matchesSpecialType = useCallback(
    (e: EmojiEntry) => {
      if (slotType === SlotType.Relic) return e.preset_type === "relic";
      if (slotType === SlotType.Familiar) return e.preset_type === "familiar";
      if (slotType === SlotType.Aspect) return e.preset_type === "aspect";
      if (slotType === SlotType.AmmoSpells) {
        return (
          e.preset_type === "ammo" ||
          e.preset_type === "spell" ||
          e.preset_slot === AMMO_PRESET_SLOT
        );
      }
      return false;
    },
    [slotType],
  );

  const options = useMemo<{ id: string }[]>(() => {
    if (!maps) return [];

    return all
      .filter((e) => {
        if (
          slotType === SlotType.Relic ||
          slotType === SlotType.Familiar ||
          slotType === SlotType.Aspect ||
          slotType === SlotType.AmmoSpells
        ) {
          return matchesSpecialType(e);
        }

        if (slotType === SlotType.Inventory) {
          if (e.preset_slot === AURA_PRESET_SLOT) return false;
          if (e.preset_type === "relic") return false;
          if (e.preset_type === "aspect") return false;
          if (e.preset_type === "ammo") return false;
          if (e.preset_type === "spell") return false;
          return true;
        }

        if (slotType === SlotType.Equipment) {
          const expectedPresetSlot = UI_TO_PRESET_SLOT[slotIndex];
          if (expectedPresetSlot == null) return false;
          if (e.preset_slot === AURA_PRESET_SLOT) return false;
          return e.preset_slot === expectedPresetSlot;
        }

        return false;
      })
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
          a.id.localeCompare(b.id, undefined, { sensitivity: "base" }),
      )
      .map((e) => ({ id: e.id }));
  }, [maps, all, slotType, slotIndex, matchesSpecialType]);

  const filterOptions = useCallback(
    (opts: { id: string }[], state: { inputValue: string }) => {
      if (!maps) return opts.slice(0, MAX_VISIBLE_OPTIONS);

      const query = state.inputValue.trim().toLowerCase();

      const enriched = opts.map((o) => ({
        ...o,
        name: maps.get(o.id)?.name ?? "",
      }));

      if (!query) {
        return enriched
          .slice(0, MAX_VISIBLE_OPTIONS)
          .map((o) => ({ id: o.id }));
      }

      const tokens = query.split(/\s+/).filter(Boolean);

      const ranked = enriched
        .map((option) => {
          const name = option.name.toLowerCase();
          const id = option.id.toLowerCase();

          let totalScore = 0;

          for (const token of tokens) {
            const nameMatch = fuzzysort.single(token, name);
            const idMatch = fuzzysort.single(token, id);

            const bestMatch = !nameMatch
              ? idMatch
              : !idMatch
                ? nameMatch
                : nameMatch.score > idMatch.score
                  ? nameMatch
                  : idMatch;

            if (!bestMatch) return null;

            totalScore += bestMatch.score;
          }

          const startsWithFirstToken = name.startsWith(tokens[0]);

          return {
            option,
            totalScore,
            startsWithFirstToken,
          };
        })
        .filter(
          (
            entry,
          ): entry is {
            option: { id: string; name: string };
            totalScore: number;
            startsWithFirstToken: boolean;
          } => entry !== null,
        )
        .sort((a, b) => {
          if (a.startsWithFirstToken !== b.startsWithFirstToken) {
            return a.startsWithFirstToken ? -1 : 1;
          }

          if (a.totalScore !== b.totalScore) {
            return b.totalScore - a.totalScore;
          }

          return (
            a.option.name.localeCompare(b.option.name, undefined, {
              sensitivity: "base",
            }) ||
            a.option.id.localeCompare(b.option.id, undefined, {
              sensitivity: "base",
            })
          );
        })
        .slice(0, MAX_VISIBLE_OPTIONS);

      return ranked.map((entry) => ({ id: entry.option.id }));
    },
    [maps],
  );

  const filterRecent = useCallback(
    (id: string) => {
      if (!maps) return false;
      const e = maps.get(id);
      if (!e) return false;

      if (
        slotType === SlotType.Relic ||
        slotType === SlotType.Familiar ||
        slotType === SlotType.Aspect ||
        slotType === SlotType.AmmoSpells
      ) {
        return matchesSpecialType(e);
      }

      if (slotType === SlotType.Inventory) {
        if (e.preset_slot === AURA_PRESET_SLOT) return false;
        if (e.preset_type === "relic") return false;
        if (e.preset_type === "aspect") return false;
        if (e.preset_type === "ammo") return false;
        if (e.preset_type === "spell") return false;
        return true;
      }

      if (slotType === SlotType.Equipment) {
        const expectedPresetSlot = UI_TO_PRESET_SLOT[slotIndex];
        if (expectedPresetSlot == null) return false;
        if (e.preset_slot === AURA_PRESET_SLOT) return false;
        return e.preset_slot === expectedPresetSlot;
      }

      return false;
    },
    [maps, slotType, slotIndex, matchesSpecialType],
  );

  const dialogTitle = useMemo(() => {
    if (slotType === SlotType.Relic) return "Select relic";
    if (slotType === SlotType.Familiar) return "Select familiar";
    if (slotType === SlotType.Aspect) return "Select aspect";
    if (slotType === SlotType.AmmoSpells) return "Select ammo/spell";
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
