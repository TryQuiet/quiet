import { ActionsType } from './types';
export declare type NotificationStore = any[];
export declare const initialState: NotificationStore;
export declare const actions: {
    enqueueSnackbar: import("redux-actions").ActionFunction1<any, import("redux-actions").Action<any>>;
    removeSnackbar: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
};
export declare type NotificationActions = ActionsType<typeof actions>;
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<NotificationStore, any>;
declare const _default: {
    actions: {
        enqueueSnackbar: import("redux-actions").ActionFunction1<any, import("redux-actions").Action<any>>;
        removeSnackbar: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<NotificationStore, any>;
};
export default _default;
