import { createSlice } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

export class SocketState {
  public isConnected: boolean = false;
}

export const socketSlice = createSlice({
  initialState: { ...new SocketState() },
  name: StoreKeys.Socket,
  reducers: {},
});

export const socketActions = socketSlice.actions;
export const socketReducer = socketSlice.reducer;
