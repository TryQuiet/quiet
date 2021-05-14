import {createSlice} from '@reduxjs/toolkit';

import {StoreKeys} from '../store.keys';

export class SessionState {
  public initSessionError: Error | null = null;
}

export const sessionSlice = createSlice({
  initialState: {...new SessionState()},
  name: StoreKeys.Session,
  reducers: {
    initSessionStart: state => {
      state.initSessionError = null;
    },
  },
});

export const sessionActions = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
