import { configureStore } from '@reduxjs/toolkit';
import presetReducer from './reducers/preset-reducer';
import recentItemReducer from './reducers/recent-item-reducer';
import settingsReducer from './reducers/setting-reducer';

export const ReduxStore = configureStore({
  reducer: {
    preset: presetReducer,
    recentItem: recentItemReducer,
    setting: settingsReducer
  }
});

export type ApplicationState = ReturnType<typeof ReduxStore.getState>;
export type AppDispatch = typeof ReduxStore.dispatch;
