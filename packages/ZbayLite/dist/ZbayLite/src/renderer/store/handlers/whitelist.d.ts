import { ActionsType } from './types';
declare class Whitelist {
    allowAll: boolean;
    whitelisted: any[];
    autoload: any[];
    constructor(values?: Partial<Whitelist>);
}
export declare const initialState: Whitelist;
export declare const actions: {
    setWhitelist: import("redux-actions").ActionFunction1<any[], import("redux-actions").Action<any[]>>;
    setWhitelistAllFlag: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
    setAutoLoadList: import("redux-actions").ActionFunction1<any[], import("redux-actions").Action<any[]>>;
};
export declare type WhitelistActions = ActionsType<typeof actions>;
export declare const initWhitelist: () => (dispatch: any) => Promise<void>;
export declare const addToWhitelist: (url: any, dontAutoload: any) => (dispatch: any) => Promise<void>;
export declare const setWhitelistAll: (allowAll: any) => (dispatch: any) => Promise<void>;
export declare const setAutoLoad: (newLink: any) => (dispatch: any) => Promise<void>;
export declare const removeImageHost: (hostname: any) => (dispatch: any) => Promise<void>;
export declare const removeSiteHost: (hostname: any) => (dispatch: any) => Promise<void>;
export declare const epics: {
    addToWhitelist: (url: any, dontAutoload: any) => (dispatch: any) => Promise<void>;
    setWhitelistAll: (allowAll: any) => (dispatch: any) => Promise<void>;
    setAutoLoad: (newLink: any) => (dispatch: any) => Promise<void>;
    initWhitelist: () => (dispatch: any) => Promise<void>;
    removeImageHost: (hostname: any) => (dispatch: any) => Promise<void>;
    removeSiteHost: (hostname: any) => (dispatch: any) => Promise<void>;
};
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<Whitelist, boolean | any[]>;
declare const _default: {
    actions: {
        setWhitelist: import("redux-actions").ActionFunction1<any[], import("redux-actions").Action<any[]>>;
        setWhitelistAllFlag: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
        setAutoLoadList: import("redux-actions").ActionFunction1<any[], import("redux-actions").Action<any[]>>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<Whitelist, boolean | any[]>;
    epics: {
        addToWhitelist: (url: any, dontAutoload: any) => (dispatch: any) => Promise<void>;
        setWhitelistAll: (allowAll: any) => (dispatch: any) => Promise<void>;
        setAutoLoad: (newLink: any) => (dispatch: any) => Promise<void>;
        initWhitelist: () => (dispatch: any) => Promise<void>;
        removeImageHost: (hostname: any) => (dispatch: any) => Promise<void>;
        removeSiteHost: (hostname: any) => (dispatch: any) => Promise<void>;
    };
};
export default _default;
