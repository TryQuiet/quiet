import { ActionsType } from './types';
export declare class Waggle {
    isWaggleConnected: boolean;
    constructor(values?: Partial<Waggle>);
}
export declare type WaggleStore = Waggle;
export declare const initialState: Waggle;
export declare const actions: {
    setIsWaggleConnected: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<boolean, string>;
};
export declare type WaggleActions = ActionsType<typeof actions>;
export declare const epics: {};
export declare const reducer: import("redux").Reducer<Waggle, import("redux").AnyAction>;
declare const _default: {
    actions: {
        setIsWaggleConnected: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<boolean, string>;
    };
    epics: {};
    reducer: import("redux").Reducer<Waggle, import("redux").AnyAction>;
};
export default _default;
