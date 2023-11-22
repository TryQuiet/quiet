import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'

import { StoreKeys } from '../store.keys'
import { errorsAdapter } from './errors.adapter'
import { type ErrorPayload } from '@quiet/types'

export class ErrorsState {
    public errors: EntityState<ErrorPayload> = errorsAdapter.getInitialState()
}

export const errorsSlice = createSlice({
    initialState: {
        ...new ErrorsState(),
    },
    name: StoreKeys.Errors,
    reducers: {
        handleError: (state, _action: PayloadAction<ErrorPayload>) => state,
        addError: (state, action: PayloadAction<ErrorPayload>) => {
            errorsAdapter.upsertOne(state.errors, action.payload)
        },
        clearError: (state, action: PayloadAction<ErrorPayload>) => {
            errorsAdapter.removeOne(state.errors, action.payload.type)
        },
    },
})

export const errorsActions = errorsSlice.actions
export const errorsReducer = errorsSlice.reducer
