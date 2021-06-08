import { createSlice } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

export class InitState {}

export const initSlice = createSlice({
  initialState: { ...new InitState() },
  name: StoreKeys.Init,
  reducers: {
    setStoreReady: state => state,
  },
});

export const initActions = initSlice.actions;
export const initReducer = initSlice.reducer;
