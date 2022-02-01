import { EntityState, PayloadAction, Dictionary } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { ErrorPayload } from './errors.types';
declare type ErrorsState = Dictionary<EntityState<ErrorPayload>>;
export declare const errorsSlice: import("@reduxjs/toolkit").Slice<ErrorsState, {
    addError: (state: import("immer/dist/internal").WritableDraft<ErrorsState>, action: PayloadAction<ErrorPayload>) => void;
}, StoreKeys.Errors>;
export declare const errorsActions: import("@reduxjs/toolkit").CaseReducerActions<{
    addError: (state: import("immer/dist/internal").WritableDraft<ErrorsState>, action: PayloadAction<ErrorPayload>) => void;
}>;
export declare const errorsReducer: import("redux").Reducer<ErrorsState, import("redux").AnyAction>;
export {};
