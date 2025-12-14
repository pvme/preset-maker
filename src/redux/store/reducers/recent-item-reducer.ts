import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type Item as ItemData } from "../../../schemas/item-data";
import { type ApplicationState } from "../store";

interface RecentItemState {
  itemQueue: ItemData[];
}

const initialState: RecentItemState = {
  itemQueue: [],
};

export const recentItemSlice = createSlice({
  name: "recent-item",
  initialState,
  reducers: {
    addToQueue: (state: RecentItemState, action: PayloadAction<ItemData>) => {
      const { id } = action.payload;

      // Do not add empty slots
      if (!id || id.trim() === "") return;

      // Remove duplicate if already present
      const existingIndex = state.itemQueue.findIndex((i) => i.id === id);
      if (existingIndex !== -1) {
        state.itemQueue.splice(existingIndex, 1);
      }

      // Ensure size limit of 5
      if (state.itemQueue.length === 5) {
        state.itemQueue.pop();
      }

      // Add new item to the front
      state.itemQueue.unshift({ id });
    },

    popQueue: (state: RecentItemState) => {
      if (state.itemQueue.length > 0) {
        state.itemQueue.pop();
      }
    },
  },
});

export const { addToQueue, popQueue } = recentItemSlice.actions;

export const selectRecentItems = (state: ApplicationState): ItemData[] =>
  state.recentItem.itemQueue;

export default recentItemSlice.reducer;
