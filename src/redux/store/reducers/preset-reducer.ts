// src/redux/store/reducers/preset-reducer.ts

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { SlotType } from "../../../schemas/slot-type";
import { type BreakdownEntry } from "../../../schemas/breakdown";
import { type Preset } from "../../../schemas/preset";
import { type Item } from "../../../schemas/item-data";
import { type ApplicationState } from "../store";

interface PresetState extends Preset {
  slotType: SlotType;
  slotIndex: number;
  selectedSlots: string[];
  slotKey: string;
}

const blankItem = (): Item => ({ id: "" });

const initialState: PresetState = {
  presetName: "",
  presetNotes: "",

  inventorySlots: Array.from({ length: 28 }, blankItem),
  equipmentSlots: Array.from({ length: 12 }, blankItem),

  familiar: blankItem(),
  relics: [],
  aspect: blankItem(),
  ammoSpells: [],

  breakdown: [],

  slotType: SlotType.Inventory,
  slotIndex: -1,
  selectedSlots: [],
  slotKey: "",
};

function moveBreakdownEntry(
  breakdown: BreakdownEntry[],
  fromType: "inventory" | "equipment",
  fromIndex: number,
  toType: "inventory" | "equipment",
  toIndex: number,
): void {
  const sourceIndex = breakdown.findIndex(
    (b) => b.slotType === fromType && b.slotIndex === fromIndex,
  );

  const targetIndex = breakdown.findIndex(
    (b) => b.slotType === toType && b.slotIndex === toIndex,
  );

  if (sourceIndex === -1 && targetIndex === -1) return;

  if (sourceIndex !== -1 && targetIndex === -1) {
    breakdown[sourceIndex] = {
      ...breakdown[sourceIndex],
      slotType: toType,
      slotIndex: toIndex,
    };
    return;
  }

  if (sourceIndex === -1 && targetIndex !== -1) {
    breakdown[targetIndex] = {
      ...breakdown[targetIndex],
      slotType: fromType,
      slotIndex: fromIndex,
    };
    return;
  }

  if (sourceIndex !== -1 && targetIndex !== -1) {
    const temp = breakdown[sourceIndex];

    breakdown[sourceIndex] = {
      ...breakdown[targetIndex],
      slotType: fromType,
      slotIndex: fromIndex,
    };

    breakdown[targetIndex] = {
      ...temp,
      slotType: toType,
      slotIndex: toIndex,
    };
  }
}

function upsertListItem(
  list: Item[],
  index: number,
  value: Item | null,
  max: number,
): Item[] {
  const next = [...list];
  const item = value ?? blankItem();

  while (next.length <= index) {
    next.push(blankItem());
  }

  next[index] = item;

  return next
    .slice(0, max)
    .filter(
      (entry, i) => entry.id || i <= highestFilledIndex(next.slice(0, max)),
    );
}

function highestFilledIndex(list: Item[]): number {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i]?.id) return i;
  }
  return -1;
}

export const presetSlice = createSlice({
  name: "preset",
  initialState,
  reducers: {
    resetToInitialState: () => initialState,

    setPresetName: (state, action: PayloadAction<string>) => {
      state.presetName = action.payload;
    },

    setPresetNotes: (state, action: PayloadAction<string>) => {
      state.presetNotes = action.payload;
    },

    setInventorySlot: (
      state,
      action: PayloadAction<{ index: number; value: Item }>,
    ) => {
      state.inventorySlots[action.payload.index] = {
        id: action.payload.value.id,
      };
    },

    setEquipmentSlot: (
      state,
      action: PayloadAction<{ index: number; value: Item }>,
    ) => {
      state.equipmentSlots[action.payload.index] = {
        id: action.payload.value.id,
      };
    },

    swapInventorySlots: (
      state,
      action: PayloadAction<{ sourceIndex: number; targetIndex: number }>,
    ) => {
      const { sourceIndex, targetIndex } = action.payload;
      const tmp = state.inventorySlots[sourceIndex];
      state.inventorySlots[sourceIndex] = state.inventorySlots[targetIndex];
      state.inventorySlots[targetIndex] = tmp;

      const a = state.breakdown.find(
        (b) => b.slotType === "inventory" && b.slotIndex === sourceIndex,
      );

      const b = state.breakdown.find(
        (b) => b.slotType === "inventory" && b.slotIndex === targetIndex,
      );

      if (a) a.slotIndex = targetIndex;
      if (b) b.slotIndex = sourceIndex;
    },

    moveSlot: (
      state,
      action: PayloadAction<{
        fromType: "inventory" | "equipment";
        fromIndex: number;
        toType: "inventory" | "equipment";
        toIndex: number;
      }>,
    ) => {
      const { fromType, fromIndex, toType, toIndex } = action.payload;

      const source =
        fromType === "inventory"
          ? state.inventorySlots[fromIndex]
          : state.equipmentSlots[fromIndex];

      if (toType === "inventory") {
        state.inventorySlots[toIndex] = source;
      } else {
        state.equipmentSlots[toIndex] = source;
      }

      if (fromType === "inventory") {
        state.inventorySlots[fromIndex] = blankItem();
      } else {
        state.equipmentSlots[fromIndex] = blankItem();
      }

      moveBreakdownEntry(state.breakdown, fromType, fromIndex, toType, toIndex);
    },

    setFamiliar: (state, action: PayloadAction<Item | null>) => {
      state.familiar = action.payload ?? blankItem();
    },

    setAspect: (state, action: PayloadAction<Item | null>) => {
      state.aspect = action.payload ?? blankItem();
    },

    setRelic: (
      state,
      action: PayloadAction<{ index: number; value: Item | null }>,
    ) => {
      state.relics = upsertListItem(
        state.relics,
        action.payload.index,
        action.payload.value,
        3,
      );
    },

    setAmmoSpells: (
      state,
      action: PayloadAction<{ index: number; value: Item | null }>,
    ) => {
      state.ammoSpells = upsertListItem(
        state.ammoSpells,
        action.payload.index,
        action.payload.value,
        3,
      );
    },

    setBreakdownEntry: (state, action: PayloadAction<BreakdownEntry>) => {
      const index = state.breakdown.findIndex(
        (b) =>
          b.slotType === action.payload.slotType &&
          b.slotIndex === action.payload.slotIndex,
      );

      if (index !== -1) {
        state.breakdown[index] = {
          slotType: action.payload.slotType,
          slotIndex: action.payload.slotIndex,
          description: action.payload.description,
        };
      } else {
        state.breakdown.push({
          slotType: action.payload.slotType,
          slotIndex: action.payload.slotIndex,
          description: action.payload.description,
        });
      }
    },

    removeBreakdownEntry: (
      state,
      action: PayloadAction<{
        slotType: "inventory" | "equipment";
        slotIndex: number;
      }>,
    ) => {
      state.breakdown = state.breakdown.filter(
        (b) =>
          !(
            b.slotType === action.payload.slotType &&
            b.slotIndex === action.payload.slotIndex
          ),
      );
    },

    importDataAction: (state, action: PayloadAction<Preset>) => {
      state.presetName = action.payload.presetName;
      state.presetNotes = action.payload.presetNotes;
      state.inventorySlots = action.payload.inventorySlots;
      state.equipmentSlots = action.payload.equipmentSlots;
      state.familiar = action.payload.familiar;
      state.relics = action.payload.relics;
      state.aspect = action.payload.aspect;
      state.ammoSpells = action.payload.ammoSpells;
      state.breakdown = action.payload.breakdown;
      state.selectedSlots = [];
    },

    updateSlotType: (state, action: PayloadAction<SlotType>) => {
      state.slotType = action.payload;
    },

    updateSlotIndex: (state, action: PayloadAction<number>) => {
      state.slotIndex = action.payload;
    },

    updateSlotKey: (state, action: PayloadAction<string>) => {
      state.slotKey = action.payload;
    },

    toggleSlotSelection: (state, action: PayloadAction<string>) => {
      const index = action.payload;
      state.selectedSlots = state.selectedSlots.includes(index)
        ? state.selectedSlots.filter((i) => i !== index)
        : [...state.selectedSlots, index];
    },

    clearSelectedSlots: (state) => {
      state.selectedSlots = [];
    },

    setSelectedSlots: (state, action: PayloadAction<string[]>) => {
      state.selectedSlots = action.payload;
    },
  },
});

export const {
  resetToInitialState,
  setPresetName,
  setPresetNotes,
  setInventorySlot,
  swapInventorySlots,
  moveSlot,
  setEquipmentSlot,
  setFamiliar,
  setAspect,
  setRelic,
  setAmmoSpells,
  setBreakdownEntry,
  removeBreakdownEntry,
  importDataAction,
  updateSlotType,
  updateSlotIndex,
  updateSlotKey,
  toggleSlotSelection,
  clearSelectedSlots,
  setSelectedSlots,
} = presetSlice.actions;

export const selectPreset = (state: ApplicationState) => state.preset;
export default presetSlice.reducer;
