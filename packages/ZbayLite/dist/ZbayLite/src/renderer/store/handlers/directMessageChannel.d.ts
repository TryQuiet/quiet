import { ActionsType } from './types';
declare class DirectMessageChannel {
    targetRecipientAddress?: string;
    targetRecipientUsername?: string;
    constructor(values?: Partial<DirectMessageChannel>);
}
export declare const initialState: DirectMessageChannel;
export declare const actions: {
    setDirectMessageRecipientAddress: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    setDirectMessageRecipientUsername: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    resetDirectMessageChannel: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
};
export declare type DirectMessageChannelActions = ActionsType<typeof actions>;
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<DirectMessageChannel, any>;
declare const _default: {
    reducer: import("redux-actions").ReduxCompatibleReducer<DirectMessageChannel, any>;
    actions: {
        setDirectMessageRecipientAddress: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
        setDirectMessageRecipientUsername: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
        resetDirectMessageChannel: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    };
};
export default _default;
