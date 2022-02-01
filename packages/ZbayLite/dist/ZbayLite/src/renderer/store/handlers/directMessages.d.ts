import { ActionsType } from './types';
export interface IUser {
    nickname: string;
    publicKey: string;
    halfKey: string;
}
export interface IConversation {
    sharedSecret: string;
    contactPublicKey: string;
    conversationId: string;
}
export declare class DirectMessages {
    users: {
        [key: string]: IUser;
    };
    conversations: {
        [key: string]: IConversation;
    };
    conversationsList: {
        [key: string]: string;
    };
    publicKey: string;
    privateKey: string;
    isAdded?: boolean;
    constructor(values?: Partial<DirectMessages>);
}
export declare type DirectMessagesStore = DirectMessages;
export declare const initialState: DirectMessagesStore;
export declare const actions: {
    fetchUsers: import("redux-actions").ActionFunction1<{
        usersList: {
            [key: string]: IUser;
        };
    }, import("redux-actions").Action<{
        usersList: {
            [key: string]: IUser;
        };
    }>>;
    setPublicKey: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    setPrivateKey: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    addConversation: import("redux-actions").ActionFunction1<IConversation, import("redux-actions").Action<IConversation>>;
    fetchConversations: import("redux-actions").ActionFunction1<{
        conversationsList: {
            [key: string]: string;
        };
    }, import("redux-actions").Action<{
        conversationsList: {
            [key: string]: string;
        };
    }>>;
};
export declare type DirectMessagesActions = ActionsType<typeof actions>;
export declare const getPrivateConversations: () => (_dispatch: any) => void;
export declare const epics: {
    generateDiffieHellman: () => (dispatch: any) => Promise<void>;
    getAvailableUsers: () => (_dispatch: any) => Promise<void>;
    getPrivateConversations: () => (_dispatch: any) => void;
    subscribeToAllConversations: () => (_dispatch: any) => Promise<void>;
};
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<DirectMessages, string | {
    usersList: {
        [key: string]: IUser;
    };
} | IConversation | {
    conversationsList: {
        [key: string]: string;
    };
}>;
declare const _default: {
    actions: {
        fetchUsers: import("redux-actions").ActionFunction1<{
            usersList: {
                [key: string]: IUser;
            };
        }, import("redux-actions").Action<{
            usersList: {
                [key: string]: IUser;
            };
        }>>;
        setPublicKey: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
        setPrivateKey: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
        addConversation: import("redux-actions").ActionFunction1<IConversation, import("redux-actions").Action<IConversation>>;
        fetchConversations: import("redux-actions").ActionFunction1<{
            conversationsList: {
                [key: string]: string;
            };
        }, import("redux-actions").Action<{
            conversationsList: {
                [key: string]: string;
            };
        }>>;
    };
    epics: {
        generateDiffieHellman: () => (dispatch: any) => Promise<void>;
        getAvailableUsers: () => (_dispatch: any) => Promise<void>;
        getPrivateConversations: () => (_dispatch: any) => void;
        subscribeToAllConversations: () => (_dispatch: any) => Promise<void>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<DirectMessages, string | {
        usersList: {
            [key: string]: IUser;
        };
    } | IConversation | {
        conversationsList: {
            [key: string]: string;
        };
    }>;
};
export default _default;
