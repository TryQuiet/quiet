import { ActionsType } from './types';
export declare const ChannelMentions: {
    nickname: string;
    timeStamp: number;
};
export declare class Mentions {
    nickname?: string;
    timeStamp?: number;
    constructor(values?: Partial<Mentions>);
}
export declare const initialState: Mentions;
export declare const actions: {
    addMentionMiss: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    clearMentionMiss: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    removeMentionMiss: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
};
export declare type MentionsActions = ActionsType<typeof actions>;
export declare const epics: {
    checkMentions: () => (dispatch: any, getState: any) => Promise<void>;
    removeMention: (nickname: any) => (dispatch: any, getState: any) => Promise<void>;
};
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<Mentions, any>;
declare const _default: {
    actions: {
        addMentionMiss: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
        clearMentionMiss: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
        removeMentionMiss: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<Mentions, any>;
    epics: {
        checkMentions: () => (dispatch: any, getState: any) => Promise<void>;
        removeMention: (nickname: any) => (dispatch: any, getState: any) => Promise<void>;
    };
};
export default _default;
