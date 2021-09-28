import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';
import { errorAdapter, errorsAdapter } from './errors.adapter';

export const GENERAL_ERRORS = 'general'

export class ErrorState {
  type: string;

  code: number;

  message: string;

  communityId?: string;

  constructor({ type, code, message, communityId }) {
    this.type = type;
    this.code = code;
    this.message = message;
    this.communityId = communityId;
  }
}

export class ErrorsState {
  id: string = '';

  errors: EntityState<ErrorPayload>;

  constructor({ communityId = null, type, code, message }) {
    this.id = communityId;
    if (!communityId) {
      this.id = GENERAL_ERRORS; // Error not connected with community
    }
    this.errors = errorAdapter.addOne(
      errorAdapter.getInitialState(),
      new ErrorState({ type, code, message, communityId })
    );
  }
}

export interface ErrorPayload {
  communityId?: string;
  type: string;
  code: number;
  message: string;
}

export const errorsSlice = createSlice({
  initialState: errorsAdapter.getInitialState(),
  name: StoreKeys.Errors,
  reducers: {
    addError: (state, action: PayloadAction<ErrorPayload>) => {
      if (state.entities[action.payload.communityId]) {
        errorsAdapter.updateOne(state, {
          id: action.payload.communityId,
          changes: {
            errors: errorAdapter.addOne(
              state.entities[action.payload.communityId].errors,
              action.payload
            ),
          },
        });
      } else {
        errorsAdapter.addOne(state, new ErrorsState(action.payload));
      }
    },
  },
});

export const errorsActions = errorsSlice.actions;
export const errorsReducer = errorsSlice.reducer;
