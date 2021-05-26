import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {StoreKeys} from '../store.keys';

export class StorageState {
  public isStorageInitialized: boolean = false;
}

export const storageSlice = createSlice({
  initialState: {...new StorageState()},
  name: StoreKeys.Storage,
  reducers: {
    responseStorageInitialized: (state, action: PayloadAction<boolean>) => {
      state.isStorageInitialized = action.payload;
    },
  },
});

export const storageActions = storageSlice.actions;
export const storageReducer = storageSlice.reducer;
