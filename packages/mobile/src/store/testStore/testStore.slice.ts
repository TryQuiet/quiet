import {createSlice} from '@reduxjs/toolkit';

import {StoreKeys} from '../store.keys';
import {testStoreAdapter} from './testStore.adapter';

export const initialTestStoreSliceState = testStoreAdapter.getInitialState();

export const testStoreSlice = createSlice({
  initialState: initialTestStoreSliceState,
  name: StoreKeys.TestStore,
  reducers: {},
});

export const testStoreActions = testStoreSlice.actions;
export const testStoreReducer = testStoreSlice.reducer;
