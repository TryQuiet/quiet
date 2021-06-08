import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

export class SocketState {
  public isConnected: boolean = false;
}

export const socketSlice = createSlice({
  initialState: { ...new SocketState() },
  name: StoreKeys.Socket,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const socketActions = socketSlice.actions;
export const socketReducer = socketSlice.reducer;
