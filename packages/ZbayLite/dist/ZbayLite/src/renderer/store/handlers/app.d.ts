import { ActionsType } from './types';
export declare class App {
    version: string;
    newUser: boolean;
    modalTabToOpen: 'channelInfo' | 'moderators' | 'notifications';
    isInitialLoadFinished: boolean;
    constructor(values?: Partial<App>);
}
export declare const initialState: App;
export declare const actions: {
    loadVersion: import("redux-actions").ActionFunction0<import("redux-actions").Action<string>>;
    setModalTab: import("redux-actions").ActionFunction1<"channelInfo" | "moderators" | "notifications", import("redux-actions").Action<"channelInfo" | "moderators" | "notifications">>;
    clearModalTab: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
};
export declare type AppActions = ActionsType<typeof actions>;
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<App, any>;
declare const _default: {
    actions: {
        loadVersion: import("redux-actions").ActionFunction0<import("redux-actions").Action<string>>;
        setModalTab: import("redux-actions").ActionFunction1<"channelInfo" | "moderators" | "notifications", import("redux-actions").Action<"channelInfo" | "moderators" | "notifications">>;
        clearModalTab: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<App, any>;
};
export default _default;
