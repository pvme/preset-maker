import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Session } from '@auth/core/types';
import { type ApplicationState } from '../store';
import { FetchState } from '../../../types/util';

interface AuthState {
  session?: Session
  fetchState: FetchState
}

const initialState: AuthState = {
  session: undefined,
  fetchState: FetchState.None
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setFetchState: (state: AuthState, action: PayloadAction<FetchState>) => {
      state.fetchState = action.payload;
    },
    setSession: (state: AuthState, action: PayloadAction<Session>) => {
      // null response -> undefined
      state.session = action.payload ?? undefined;

      // A null response is still considered as a successful request.
      if (action.payload !== undefined) {
        state.fetchState = FetchState.Success;
      }
    },
    clearSession: (state: AuthState, action: PayloadAction<undefined>) => {
      state.session = undefined;
      state.fetchState = FetchState.None;
    }
    // TODO: Sign out
  }
});

export const { setSession, setFetchState } = authSlice.actions;

export const selectAuth = (state: ApplicationState): AuthState => state.auth;

export default authSlice.reducer;
