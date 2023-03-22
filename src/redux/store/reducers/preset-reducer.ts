import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { ItemData } from "../../../types/inventory-slot";
import { ApplicationState } from "../store";
import { ImportData } from "../../../types/import-data";
import { SlotType } from "../../../types/slot-type";
import { Breakdown, BreakdownType } from "../../../types/breakdown";

// Define a type for the slice state
interface PresetState {
  presetName: string;
  inventorySlots: ItemData[];
  equipmentSlots: ItemData[];
  breakdown: Breakdown[];
  slotType: SlotType;
  slotIndex: number;
}

interface SetSlot {
  index: number;
  item: ItemData;
}

// Define the initial state using that type
const initialState: PresetState = {
  presetName: "",
  inventorySlots: new Array(28).fill({
    name: "",
    image: "",
    label: "",
    selected: false,
    breakdownNotes: "",
  }),
  equipmentSlots: new Array(13).fill({
    name: "",
    image: "",
    label: "",
    breakdownNotes: "",
  }),
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
      state.inventorySlots[action.payload.index] = action.payload.item;
    },
    setEquipmentSlot: (state: PresetState, action: PayloadAction<SetSlot>) => {
      state.equipmentSlots[action.payload.index] = action.payload.item;
    },
    setEntireBreakdown: (
      state: PresetState,
      action: PayloadAction<Breakdown[]>
    ) => {
      state.breakdown = action.payload;
    },
    setBreakdown: (state: PresetState, action: PayloadAction<Breakdown>) => {
      console.log("Called");
      switch (action.payload.breakdownType) {
        case BreakdownType.Equipment:
          // set all descriptions of the same item name
          state.equipmentSlots
            .filter((item) => item.label === action.payload.itemName)
            .forEach(
              (item: ItemData) =>
                (item.breakdownNotes = action.payload.description)
            );
          break;
        case BreakdownType.Inventory:
          // set all descriptions of the same item name
          state.inventorySlots
            .filter((item) => item.label === action.payload.itemName)
            .forEach(
              (item: ItemData) =>
                (item.breakdownNotes = action.payload.description)
            );
          break;
      }
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
