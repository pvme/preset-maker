// src/redux/store/reducers/preset-reducer.ts

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { SlotType } from "../../../schemas/slot-type";
import { type BreakdownEntry } from "../../../schemas/breakdown";
import { type Preset } from "../../../schemas/preset";
import { type Item } from "../../../schemas/item-data";
import { type Familiar } from "../../../schemas/familiar";
import { type Relic } from "../../../schemas/relic";
import { type ApplicationState } from "../store";

interface PresetState extends Preset {
  slotType: SlotType;
  slotIndex: number;
  selectedSlots: string[];
  slotKey: string;
}

const blankItem = (): Item => ({ id: "" });
const blankFamiliar = (): Familiar => ({ id: "" });
const blankRelic = (): Relic => ({ id: "" });

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
  selectedSlots: [],
  slotKey: "",
};

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

    setBreakdownEntry: (state, action: PayloadAction<BreakdownEntry>) => {
      const index = state.breakdown.findIndex(
        (b) =>
          b.slotType === action.payload.slotType &&
          b.slotIndex === action.payload.slotIndex
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
      action: PayloadAction<{ slotType: "inventory" | "equipment"; slotIndex: number }>
    ) => {
      state.breakdown = state.breakdown.filter(
        (b) =>
          !(
            b.slotType === action.payload.slotType &&
            b.slotIndex === action.payload.slotIndex
          )
      );
    },

    importDataAction: (state, action: PayloadAction<Preset>) => {
      state.presetName = action.payload.presetName;
      state.presetNotes = action.payload.presetNotes;
      state.inventorySlots = action.payload.inventorySlots;
      state.equipmentSlots = action.payload.equipmentSlots;
      state.relics = action.payload.relics;
      state.familiars = action.payload.familiars;
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

export const selectPreset = (state: ApplicationState) => state.preset;
export default presetSlice.reducer;
