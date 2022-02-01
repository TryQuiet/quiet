import { ActionsType } from './types';
declare class CriticalError {
    message: string;
    traceback: string;
    constructor(values?: Partial<CriticalError>);
}
export declare const initialState: CriticalError;
export declare const actions: {
    setCriticalError: import("redux-actions").ActionFunction1<{
        message: string;
        traceback: string;
    }, import("redux-actions").Action<{
        message: string;
        traceback: string;
    }>>;
};
export declare type CriticalErrorActions = ActionsType<typeof actions>;
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<CriticalError, {
    message: string;
    traceback: string;
}>;
declare const _default: {
    actions: {
        setCriticalError: import("redux-actions").ActionFunction1<{
            message: string;
            traceback: string;
        }, import("redux-actions").Action<{
            message: string;
            traceback: string;
        }>>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<CriticalError, {
        message: string;
        traceback: string;
    }>;
};
export default _default;
