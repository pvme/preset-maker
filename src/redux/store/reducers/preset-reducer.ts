import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { ItemData } from "../../../types/inventory-slot";
import { ApplicationState } from "../store";
import { ImportData } from "../../../types/import-data";
import { SlotType } from "../../../types/slot-type";
import { Breakdown, BreakdownType } from "../../../types/breakdown";
import { AuraData, Auras } from "../../../types/auras";
import { RelicData, Relics } from "../../../types/relics";

// Define a type for the slice state
interface PresetState {
  presetName: string;
  inventorySlots: ItemData[];
  equipmentSlots: ItemData[];
  auras: Auras;
  relics: Relics;
  breakdown: Breakdown[];
  slotType: SlotType;
  slotIndex: number;
}

interface IndexedSlot<T> {
  index: number;
  value: T;
}

type SetSlot = IndexedSlot<ItemData>;
type AuraSlot = IndexedSlot<AuraData>
type RelicSlot = IndexedSlot<RelicData>;

// Define the initial state using that type
const initialState: PresetState = {
  presetName: "",
  inventorySlots: Array.from({ length: 28 }, () => ({
    name: "",
    image: "",
    label: "",
    selected: false,
    breakdownNotes: "",
  })),
  equipmentSlots: new Array(13).fill({
    name: "",
    image: "",
    label: "",
    breakdownNotes: "",
  }),
  auras: {
    primaryAuras: [],
    alternativeAuras: [],
  },
  relics: {
    primaryRelics: [],
    alternativeRelics: [],
  },
  breakdown: [],
  slotType: SlotType.Inventory,
  slotIndex: -1,
};

export const presetSlice = createSlice({
  name: "preset",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    resetSlots: (state: PresetState) => {
      state.presetName = initialState.presetName;
      state.inventorySlots = initialState.inventorySlots;
      state.equipmentSlots = initialState.equipmentSlots;
    },
    setPresetName: (state: PresetState, action: PayloadAction<string>) => {
      state.presetName = action.payload;
    },
    setInventorySlot: (state: PresetState, action: PayloadAction<SetSlot>) => {
      state.inventorySlots[action.payload.index] = action.payload.value;
    },
    setEquipmentSlot: (state: PresetState, action: PayloadAction<SetSlot>) => {
      state.equipmentSlots[action.payload.index] = action.payload.value;
    },
    setPrimaryAura: (state: PresetState, action: PayloadAction<AuraSlot>) => {
      state.auras.primaryAuras[action.payload.index] = action.payload.value;
    },
    setPrimaryRelic: (state: PresetState, action: PayloadAction<RelicSlot>) => {
      state.relics.primaryRelics[action.payload.index] = action.payload.value;
    },
    setEntireBreakdown: (
      state: PresetState,
      action: PayloadAction<Breakdown[]>
    ) => {
      state.breakdown = action.payload;
    },
    setBreakdown: (state: PresetState, action: PayloadAction<Breakdown>) => {
      const { breakdownType, itemName, description } = action.payload;

      const targetSlots =
        breakdownType === BreakdownType.Equipment
          ? state.equipmentSlots
          : state.inventorySlots;

      targetSlots
        .filter((item) => item.label === itemName)
        .forEach((item: ItemData) => (item.breakdownNotes = description));
    },
    importDataAction: (
      state: PresetState,
      action: PayloadAction<ImportData>
    ) => {
      state.presetName = action.payload.presetName;
      state.inventorySlots = action.payload.inventorySlots;
      state.equipmentSlots = action.payload.equipmentSlots;
    },
    updateSlotType: (state: PresetState, action: PayloadAction<SlotType>) => {
      state.slotType = action.payload;
    },
    updateSlotIndex: (state: PresetState, action: PayloadAction<number>) => {
      state.slotIndex = action.payload;
    },
    toggleSlotSelection: (
      state: PresetState,
      action: PayloadAction<number>
    ) => {
      state.inventorySlots[action.payload].selected =
        !state.inventorySlots[action.payload].selected;
    },
    clearSlotSelection: (state: PresetState) => {
      state.inventorySlots = state.inventorySlots.map((slot) => ({
        ...slot,
        selected: false,
      }));
    },
  },
});

export const {
  resetSlots,
  setPresetName,
  setInventorySlot,
  setEquipmentSlot,
  setEntireBreakdown,
  setBreakdown,
  importDataAction,
  updateSlotType,
  updateSlotIndex,
  toggleSlotSelection,
  clearSlotSelection,
} = presetSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectPreset = (state: ApplicationState) => state.preset;
export const selectPresetName = (state: ApplicationState) =>
  state.preset.presetName;
export const selectInventorySlots = (state: ApplicationState) =>
  state.preset.inventorySlots;
export const selectBreakdown = (state: ApplicationState) =>
  state.preset.breakdown;

export default presetSlice.reducer;
