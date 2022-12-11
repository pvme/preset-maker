import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ItemData } from "../../../types/inventory-slot";
import { ApplicationState } from "../store";

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
      // Check if the item has all empty values
      if (Object.values(action.payload).every((value) => !value)) {
        // If it does, return without adding it to the queue
        return;
      }

      // Check if the queue is at its size limit
      if (state.itemQueue.length === 5) {
        // If it is, remove the last item in the queue to make room for the new item
        state.itemQueue.pop();
      }

      // Check if the item already exists in the queue
      const sameIndex = state.itemQueue.map((i) => i.name).indexOf(action.payload.name);
      if (sameIndex !== -1) {
        // If it does, remove it from the queue
        // So we can put it at the front of the queue
        state.itemQueue.splice(sameIndex, 1);
      }

      // Add item to the front of thequeue
      state.itemQueue.unshift(action.payload);
    },
    popQueue: (state: RecentItemState) => {
      // Check if the queue is empty
      if (state.itemQueue.length > 0) {
        // If it's not, remove the last item in the queue
        state.itemQueue.pop();
      }
    },
  },
});

export const { addToQueue, popQueue } = recentItemSlice.actions;

export const selectRecentItems = (state: ApplicationState) => state.recentItem.itemQueue;

export default recentItemSlice.reducer;
