import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

export class ErrorsState {
  public certificateRegistration: string = '';
}

export const errorsSlice = createSlice({
  initialState: { ...new ErrorsState() },
  name: StoreKeys.Errors,
  reducers: {
    certificateRegistration: (state, action: PayloadAction<string>) => {
      state.certificateRegistration = action.payload;
    },
  },
});

export const errorsActions = errorsSlice.actions;
export const errorsReducer = errorsSlice.reducer;
