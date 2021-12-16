import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';

export class AppState {}

export const appSlice = createSlice({
  initialState: { ...new AppState() },
  name: StoreKeys.App,
  reducers: {
    closeServices: state => state,
  },
});

export const appActions = appSlice.actions;
export const appReducer = appSlice.reducer;
