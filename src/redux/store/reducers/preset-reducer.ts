// src/redux/store/reducers/preset-reducer.ts

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { type Item } from "../../../schemas/item-data";
import { type ApplicationState } from "../store";
import { type SavedPreset } from "../../../schemas/saved-preset-data";
import { SlotType } from "../../../schemas/slot-type";
import { type BreakdownEntry } from "../../../schemas/breakdown";
import { type Familiars, type Familiar } from "../../../schemas/familiar";
import { type Relics, type Relic } from "../../../schemas/relic";

interface PresetState {
  presetName: string;
  presetNotes: string;

  inventorySlots: Item[];
  equipmentSlots: Item[];

  familiars: Familiars;
  relics: Relics;

  breakdown: BreakdownEntry[];

  slotType: SlotType;
  slotIndex: number;

  selectedSlots: string[];
  slotKey: string;
}

//
// Blank creators (ID-only)
//
const blankItem = (): Item => ({ id: "" });
const blankFamiliar = (): Familiar => ({ id: "" });
const blankRelic = (): Relic => ({ id: "" });

//
// Initial State
//
const initialState: PresetState = {
  presetName: "",
  presetNotes: "",

  inventorySlots: Array.from({ length: 28 }, blankItem),
  equipmentSlots: Array.from({ length: 13 }, blankItem),

  familiars: {
    primaryFamiliars: Array.from({ length: 1 }, blankFamiliar),
    alternativeFamiliars: Array.from({ length: 3 }, blankFamiliar),
  },

  relics: {
    primaryRelics: Array.from({ length: 3 }, blankRelic),
    alternativeRelics: Array.from({ length: 3 }, blankRelic),
  },

  breakdown: [],

  slotType: SlotType.Inventory,
  slotIndex: -1,

  /** Multi-select initially empty */
  selectedSlots: [],
  slotKey: "",
};

//
// Slice
//
export const presetSlice = createSlice({
  name: "preset",
  initialState,
  reducers: {
    resetToInitialState: () => initialState,

    //
    // Basic fields
    //
    setPresetName: (state, action: PayloadAction<string>) => {
      state.presetName = action.payload;
    },

    setPresetNotes: (state, action: PayloadAction<string>) => {
      state.presetNotes = action.payload;
    },

    //
    // Slot assignment
    //
    setInventorySlot: (
      state,
      action: PayloadAction<{ index: number; value: Item }>
    ) => {
      state.inventorySlots[action.payload.index] = { id: action.payload.value.id };
    },

    setEquipmentSlot: (
      state,
      action: PayloadAction<{ index: number; value: Item }>
    ) => {
      state.equipmentSlots[action.payload.index] = { id: action.payload.value.id };
    },

    swapInventorySlots: (
      state,
      action: PayloadAction<{ sourceIndex: number; targetIndex: number }>
    ) => {
      const { sourceIndex, targetIndex } = action.payload;
      const tmp = state.inventorySlots[sourceIndex];
      state.inventorySlots[sourceIndex] = state.inventorySlots[targetIndex];
      state.inventorySlots[targetIndex] = tmp;
    },

    //
    // Relics / Familiars
    //
    setPrimaryRelic: (
      state,
      action: PayloadAction<{ index: number; value: Relic | null }>
    ) => {
      state.relics.primaryRelics[action.payload.index] =
        action.payload.value ?? blankRelic();
    },

    setAlternativeRelic: (
      state,
      action: PayloadAction<{ index: number; value: Relic | null }>
    ) => {
      state.relics.alternativeRelics[action.payload.index] =
        action.payload.value ?? blankRelic();
    },

    setPrimaryFamiliar: (
      state,
      action: PayloadAction<{ index: number; value: Familiar | null }>
    ) => {
      state.familiars.primaryFamiliars[action.payload.index] =
        action.payload.value ?? blankFamiliar();
    },

    setAlternativeFamiliar: (
      state,
      action: PayloadAction<{ index: number; value: Familiar | null }>
    ) => {
      state.familiars.alternativeFamiliars[action.payload.index] =
        action.payload.value ?? blankFamiliar();
    },

    //
    // Breakdown System
    //
    setBreakdownEntry: (state, action: PayloadAction<BreakdownEntry>) => {
      const existing = state.breakdown.find(
        (b) =>
          b.slotType === action.payload.slotType &&
          b.slotIndex === action.payload.slotIndex
      );

      if (existing) {
        existing.description = action.payload.description;
      } else {
        state.breakdown.push(action.payload);
      }
    },

    removeBreakdownEntry: (
        state, action: PayloadAction<{ slotType: "inventory" | "equipment"; slotIndex: number }>
    ) => {
      state.breakdown = state.breakdown.filter(
        (b) =>
          !(
            b.slotType === action.payload.slotType &&
            b.slotIndex === action.payload.slotIndex
          )
      );
    },

    //
    // Importing a preset
    //
    importDataAction: (state, action: PayloadAction<Partial<SavedPreset>>) => {
      state.presetName = action.payload.presetName ?? "";
      state.presetNotes = action.payload.presetNotes ?? "";

      state.inventorySlots =
        action.payload.inventorySlots ?? initialState.inventorySlots;

      state.equipmentSlots =
        action.payload.equipmentSlots ?? initialState.equipmentSlots;

      state.relics = action.payload.relics ?? initialState.relics;
      state.familiars = action.payload.familiars ?? initialState.familiars;

      state.breakdown = action.payload.breakdown ?? [];

      // Always clear selection when a preset loads
      state.selectedSlots = [];
    },

    //
    // UI controls
    //
    updateSlotType: (state, action: PayloadAction<SlotType>) => {
      state.slotType = action.payload;
    },

    updateSlotIndex: (state, action: PayloadAction<number>) => {
      state.slotIndex = action.payload;
    },

    updateSlotKey: (state, action: PayloadAction<string>) => {
      state.slotKey = action.payload;
    },

    //
    // Multi-selection controls
    //
    toggleSlotSelection: (state, action: PayloadAction<string>) => {
      const index = action.payload;
      if (state.selectedSlots.includes(index)) {
        state.selectedSlots = state.selectedSlots.filter((i) => i !== index);
      } else {
        state.selectedSlots.push(index);
      }
    },

    clearSelectedSlots: (state) => {
      state.selectedSlots = [];
    },

    setSelectedSlots: (state, action: PayloadAction<string[]>) => {
      state.selectedSlots = action.payload;
    },
  },
});

//
// Exports
//
export const {
  resetToInitialState,
  setPresetName,
  setPresetNotes,
  setInventorySlot,
  swapInventorySlots,
  setEquipmentSlot,
  setPrimaryRelic,
  setAlternativeRelic,
  setPrimaryFamiliar,
  setAlternativeFamiliar,
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

export const selectPreset = (state: ApplicationState): PresetState =>
  state.preset;

export default presetSlice.reducer;
