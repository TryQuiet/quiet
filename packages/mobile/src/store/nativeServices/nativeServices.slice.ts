import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';

export class NativeServicesState {}

export const nativeServicesSlice = createSlice({
  initialState: { ...new NativeServicesState() },
  name: StoreKeys.NativeServices,
  reducers: {
    startWaggle: (state, _action: PayloadAction<string>) => state,
    initPushNotifications: state => state,
  },
});

export const nativeServicesActions = nativeServicesSlice.actions;
export const nativeServicesReducer = nativeServicesSlice.reducer;
