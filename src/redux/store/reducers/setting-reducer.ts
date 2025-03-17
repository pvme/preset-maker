import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ApplicationState } from '../store';

export enum AppMode {
  Edit = 'edit',
  View = 'view'
}

interface Settingtate {
  mode: AppMode
}

const initialState: Settingtate = {
  mode: AppMode.View
};

export const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setMode (state, action: PayloadAction<AppMode>) {
      state.mode = action.payload;
    }
  }
});

export const { setMode } = settingSlice.actions;

export const getMode = (state: ApplicationState): AppMode => state.setting.mode; ;

export default settingSlice.reducer;
