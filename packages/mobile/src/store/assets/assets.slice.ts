import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

export class AssetsState {
  public currentWaggleVersion: string = '';
  public currentLibsVersion: string = '';
  public downloadHint: string = '';
  public downloadProgress: number = 0;
}

export const assetsSlice = createSlice({
  initialState: { ...new AssetsState() },
  name: StoreKeys.Assets,
  reducers: {
    setCurrentWaggleVersion: (state, action: PayloadAction<string>) => {
      state.currentWaggleVersion = action.payload;
    },
    setCurrentLibsVersion: (state, action: PayloadAction<string>) => {
      state.currentLibsVersion = action.payload;
    },
    setDownloadHint: (state, action: PayloadAction<string>) => {
      state.downloadHint = action.payload;
    },
    setDownloadProgress: (state, action: PayloadAction<number>) => {
      state.downloadProgress = action.payload;
    },
    setDownloadError: (state, _action: PayloadAction<string>) => state,
    setDownloadCompleted: state => state,
    retryDownload: state => state,
  },
});

export const assetsActions = assetsSlice.actions;
export const assetsReducer = assetsSlice.reducer;
