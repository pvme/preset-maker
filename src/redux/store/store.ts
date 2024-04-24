import { configureStore } from '@reduxjs/toolkit';
import presetReducer from './reducers/preset-reducer';
import recentItemReducer from './reducers/recent-item-reducer';
import authReducer from './reducers/auth-reducer';

export const ReduxStore = configureStore({
  reducer: {
    auth: authReducer,
    preset: presetReducer,
    recentItem: recentItemReducer
  }
});

export type ApplicationState = ReturnType<typeof ReduxStore.getState>;
export type AppDispatch = typeof ReduxStore.dispatch;
