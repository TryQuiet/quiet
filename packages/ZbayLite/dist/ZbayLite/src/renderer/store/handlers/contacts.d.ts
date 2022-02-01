import { DateTime } from 'luxon';
import { ActionsType } from './types';
export declare class Contact {
    lastSeen?: DateTime;
    key: string;
    username: string;
    address: string;
    newMessages: string[];
    vaultMessages: any[];
    messages: any[];
    offerId?: string;
    unread?: number;
    connected?: boolean;
    nickname?: string;
    constructor(values?: Partial<Contact>);
    typingIndicator: boolean;
}
export interface ISender {
    replyTo: string;
    username: string;
}
export interface ContactsStore {
    [key: string]: Contact;
}
export declare const actions: {
    setMessages: import("redux-actions").ActionFunction1<{
        messages: any[] | {
            [key: string]: any;
        };
        contactAddress: string;
        username: string;
        key: string;
    }, import("redux-actions").Action<{
        messages: any[] | {
            [key: string]: any;
        };
        contactAddress: string;
        username: string;
        key: string;
    }>>;
    setChannelMessages: import("redux-actions").ActionFunction1<{
        messages: any[] | {
            [key: string]: any;
        };
        contactAddress: string;
        username: string;
        key: string;
    }, import("redux-actions").Action<{
        messages: any[] | {
            [key: string]: any;
        };
        contactAddress: string;
        username: string;
        key: string;
    }>>;
    setAllMessages: import("redux-actions").ActionFunction1<{
        messages: any[];
        contactAddress: string;
        username: string;
        key: string;
    }, import("redux-actions").Action<{
        messages: any[];
        contactAddress: string;
        username: string;
        key: string;
    }>>;
    updateMessage: import("redux-actions").ActionFunction1<{
        key: string;
        id: string;
        txid: string;
    }, import("redux-actions").Action<{
        key: string;
        id: string;
        txid: string;
    }>>;
    addMessage: import("redux-actions").ActionFunction1<{
        key: string;
        message: {
            [key: string]: any;
        };
    }, import("redux-actions").Action<{
        key: string;
        message: {
            [key: string]: any;
        };
    }>>;
    addContact: import("redux-actions").ActionFunction1<{
        offerId?: string;
        contactAddress: string;
        username: string;
        key: string;
    }, import("redux-actions").Action<{
        offerId?: string;
        contactAddress: string;
        username: string;
        key: string;
    }>>;
    addDirectContact: import("redux-actions").ActionFunction1<{
        offerId?: string;
        contactAddress: string;
        username: string;
        key: string;
    }, import("redux-actions").Action<{
        offerId?: string;
        contactAddress: string;
        username: string;
        key: string;
    }>>;
    setVaultMessages: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    cleanNewMessages: import("redux-actions").ActionFunction1<{
        contactAddress: string;
    }, import("redux-actions").Action<{
        contactAddress: string;
    }>>;
    appendNewMessages: import("redux-actions").ActionFunction1<{
        contactAddress: string;
        messagesIds: string[];
    }, import("redux-actions").Action<{
        contactAddress: string;
        messagesIds: string[];
    }>>;
    setLastSeen: import("redux-actions").ActionFunction1<{
        lastSeen: DateTime;
        contact: Contact;
    }, import("redux-actions").Action<{
        lastSeen: DateTime;
        contact: Contact;
    }>>;
    setUsernames: import("redux-actions").ActionFunction1<{
        sender: ISender;
    }, import("redux-actions").Action<{
        sender: ISender;
    }>>;
    removeContact: import("redux-actions").ActionFunction1<{
        address: string;
    }, import("redux-actions").Action<{
        address: string;
    }>>;
    setMessageBlockTime: import("redux-actions").ActionFunction1<{
        contactAddress: string;
        messageId: string;
        blockTime: number;
    }, import("redux-actions").Action<{
        contactAddress: string;
        messageId: string;
        blockTime: number;
    }>>;
    setContactConnected: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    setTypingIndicator: import("redux-actions").ActionFunction1<{
        contactAddress: string;
        typingIndicator: boolean;
    }, import("redux-actions").Action<{
        contactAddress: string;
        typingIndicator: boolean;
    }>>;
};
export declare type ContactActions = ActionsType<typeof actions>;
export declare const loadContact: (address: any) => (dispatch: any, getState: any) => Promise<void>;
export declare const updatePendingMessage: ({ key, id, txid }: {
    key: any;
    id: any;
    txid: any;
}) => (dispatch: any) => Promise<void>;
export declare const linkUserRedirect: (contact: any) => (dispatch: any, getState: any) => Promise<void>;
export declare const updateLastSeen: ({ contact }: {
    contact: any;
}) => (dispatch: any, getState: any) => Promise<void>;
export declare const createVaultContact: ({ contact, history, redirect }: {
    contact: any;
    history: any;
    redirect?: boolean;
}) => (dispatch: any, getState: any) => Promise<void>;
export declare const deleteChannel: ({ address, history }: {
    address: any;
    history: any;
}) => (dispatch: any) => Promise<void>;
export declare const epics: {
    updateLastSeen: ({ contact }: {
        contact: any;
    }) => (dispatch: any, getState: any) => Promise<void>;
    loadContact: (address: any) => (dispatch: any, getState: any) => Promise<void>;
    createVaultContact: ({ contact, history, redirect }: {
        contact: any;
        history: any;
        redirect?: boolean;
    }) => (dispatch: any, getState: any) => Promise<void>;
    deleteChannel: ({ address, history }: {
        address: any;
        history: any;
    }) => (dispatch: any) => Promise<void>;
    linkUserRedirect: (contact: any) => (dispatch: any, getState: any) => Promise<void>;
};
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<ContactsStore, any>;
declare const _default: {
    epics: {
        updateLastSeen: ({ contact }: {
            contact: any;
        }) => (dispatch: any, getState: any) => Promise<void>;
        loadContact: (address: any) => (dispatch: any, getState: any) => Promise<void>;
        createVaultContact: ({ contact, history, redirect }: {
            contact: any;
            history: any;
            redirect?: boolean;
        }) => (dispatch: any, getState: any) => Promise<void>;
        deleteChannel: ({ address, history }: {
            address: any;
            history: any;
        }) => (dispatch: any) => Promise<void>;
        linkUserRedirect: (contact: any) => (dispatch: any, getState: any) => Promise<void>;
    };
    actions: {
        setMessages: import("redux-actions").ActionFunction1<{
            messages: any[] | {
                [key: string]: any;
            };
            contactAddress: string;
            username: string;
            key: string;
        }, import("redux-actions").Action<{
            messages: any[] | {
                [key: string]: any;
            };
            contactAddress: string;
            username: string;
            key: string;
        }>>;
        setChannelMessages: import("redux-actions").ActionFunction1<{
            messages: any[] | {
                [key: string]: any;
            };
            contactAddress: string;
            username: string;
            key: string;
        }, import("redux-actions").Action<{
            messages: any[] | {
                [key: string]: any;
            };
            contactAddress: string;
            username: string;
            key: string;
        }>>;
        setAllMessages: import("redux-actions").ActionFunction1<{
            messages: any[];
            contactAddress: string;
            username: string;
            key: string;
        }, import("redux-actions").Action<{
            messages: any[];
            contactAddress: string;
            username: string;
            key: string;
        }>>;
        updateMessage: import("redux-actions").ActionFunction1<{
            key: string;
            id: string;
            txid: string;
        }, import("redux-actions").Action<{
            key: string;
            id: string;
            txid: string;
        }>>;
        addMessage: import("redux-actions").ActionFunction1<{
            key: string;
            message: {
                [key: string]: any;
            };
        }, import("redux-actions").Action<{
            key: string;
            message: {
                [key: string]: any;
            };
        }>>;
        addContact: import("redux-actions").ActionFunction1<{
            offerId?: string;
            contactAddress: string;
            username: string;
            key: string;
        }, import("redux-actions").Action<{
            offerId?: string;
            contactAddress: string;
            username: string;
            key: string;
        }>>;
        addDirectContact: import("redux-actions").ActionFunction1<{
            offerId?: string;
            contactAddress: string;
            username: string;
            key: string;
        }, import("redux-actions").Action<{
            offerId?: string;
            contactAddress: string;
            username: string;
            key: string;
        }>>;
        setVaultMessages: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
        cleanNewMessages: import("redux-actions").ActionFunction1<{
            contactAddress: string;
        }, import("redux-actions").Action<{
            contactAddress: string;
        }>>;
        appendNewMessages: import("redux-actions").ActionFunction1<{
            contactAddress: string;
            messagesIds: string[];
        }, import("redux-actions").Action<{
            contactAddress: string;
            messagesIds: string[];
        }>>;
        setLastSeen: import("redux-actions").ActionFunction1<{
            lastSeen: DateTime;
            contact: Contact;
        }, import("redux-actions").Action<{
            lastSeen: DateTime;
            contact: Contact;
        }>>;
        setUsernames: import("redux-actions").ActionFunction1<{
            sender: ISender;
        }, import("redux-actions").Action<{
            sender: ISender;
        }>>;
        removeContact: import("redux-actions").ActionFunction1<{
            address: string;
        }, import("redux-actions").Action<{
            address: string;
        }>>;
        setMessageBlockTime: import("redux-actions").ActionFunction1<{
            contactAddress: string;
            messageId: string;
            blockTime: number;
        }, import("redux-actions").Action<{
            contactAddress: string;
            messageId: string;
            blockTime: number;
        }>>;
        setContactConnected: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
        setTypingIndicator: import("redux-actions").ActionFunction1<{
            contactAddress: string;
            typingIndicator: boolean;
        }, import("redux-actions").Action<{
            contactAddress: string;
            typingIndicator: boolean;
        }>>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<ContactsStore, any>;
};
export default _default;
