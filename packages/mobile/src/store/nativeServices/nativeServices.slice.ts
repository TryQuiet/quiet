import { createSlice } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';

export class NativeServicesState {}

export const nativeServicesSlice = createSlice({
  initialState: { ...new NativeServicesState() },
  name: StoreKeys.NativeServices,
  reducers: {
    initPushNotifications: state => state,
  },
});

export const nativeServicesActions = nativeServicesSlice.actions;
export const nativeServicesReducer = nativeServicesSlice.reducer;
