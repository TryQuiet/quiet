import { StoreKeys } from '../store.keys';
export declare class AppState {
}
export declare const appSlice: import("@reduxjs/toolkit").Slice<{}, {
    closeServices: (state: import("immer/dist/internal").WritableDraft<{}>) => import("immer/dist/internal").WritableDraft<{}>;
}, StoreKeys.App>;
export declare const appActions: import("@reduxjs/toolkit").CaseReducerActions<{
    closeServices: (state: import("immer/dist/internal").WritableDraft<{}>) => import("immer/dist/internal").WritableDraft<{}>;
}>;
export declare const appReducer: import("redux").Reducer<{}, import("redux").AnyAction>;
