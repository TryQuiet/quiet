import { ActionsType } from './types';
export declare const NotificationsCenter: {
    channels: {};
    user: {};
    contacts: {};
};
declare class NotificationCenter {
    channels: {
        [id: string]: number;
    };
    user: {
        filterType?: number;
        sound?: number;
    };
    contacts: {
        [id: string]: number;
    };
    constructor(values?: Partial<NotificationCenter>);
}
export declare const initialState: NotificationCenter;
export declare const actions: {
    setChannelNotificationFilter: import("redux-actions").ActionFunction1<{
        channelId: string;
        filterType: number;
    }, import("redux-actions").Action<{
        channelId: string;
        filterType: number;
    }>>;
    setChannelNotificationSettings: import("redux-actions").ActionFunction1<{
        channelsData: {
            [id: string]: number;
        };
    }, import("redux-actions").Action<{
        channelsData: {
            [id: string]: number;
        };
    }>>;
    setUserNotificationFilter: import("redux-actions").ActionFunction1<{
        filterType: number;
    }, import("redux-actions").Action<{
        filterType: number;
    }>>;
    setUserNotificationSettings: import("redux-actions").ActionFunction1<{
        userData: {
            filterType: number;
            sound: number;
        };
    }, import("redux-actions").Action<{
        userData: {
            filterType: number;
            sound: number;
        };
    }>>;
    setContactNotificationFilter: import("redux-actions").ActionFunction1<{
        contact: string;
        filterType: number;
    }, import("redux-actions").Action<{
        contact: string;
        filterType: number;
    }>>;
    setContactsNotificationSettings: import("redux-actions").ActionFunction1<{
        contacts: {
            [id: string]: number;
        };
    }, import("redux-actions").Action<{
        contacts: {
            [id: string]: number;
        };
    }>>;
    setUserNotificationSound: import("redux-actions").ActionFunction1<{
        sound: number;
    }, import("redux-actions").Action<{
        sound: number;
    }>>;
};
export declare type NotificationCenterActions = ActionsType<typeof actions>;
export declare const init: () => (dispatch: any, getState: any) => Promise<void>;
export declare const setChannelsNotification: (filterType: any) => (dispatch: any, getState: any) => Promise<void>;
export declare const setContactNotification: (filterType: any) => (dispatch: any, getState: any) => Promise<void>;
export declare const unblockUserNotification: (address: any) => (dispatch: any) => Promise<void>;
export declare const setUserNotification: (filterType: any) => (dispatch: any) => Promise<void>;
export declare const setUserNotificationsSound: (sound: any) => (dispatch: any) => Promise<void>;
export declare const epics: {
    init: () => (dispatch: any, getState: any) => Promise<void>;
    setChannelsNotification: (filterType: any) => (dispatch: any, getState: any) => Promise<void>;
    setUserNotification: (filterType: any) => (dispatch: any) => Promise<void>;
    setContactNotification: (filterType: any) => (dispatch: any, getState: any) => Promise<void>;
    setUserNotificationsSound: (sound: any) => (dispatch: any) => Promise<void>;
    unblockUserNotification: (address: any) => (dispatch: any) => Promise<void>;
};
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<NotificationCenter, {
    channelId: string;
    filterType: number;
} | {
    channelsData: {
        [id: string]: number;
    };
} | {
    filterType: number;
} | {
    userData: {
        filterType: number;
        sound: number;
    };
} | {
    contact: string;
    filterType: number;
} | {
    contacts: {
        [id: string]: number;
    };
} | {
    sound: number;
}>;
declare const _default: {
    actions: {
        setChannelNotificationFilter: import("redux-actions").ActionFunction1<{
            channelId: string;
            filterType: number;
        }, import("redux-actions").Action<{
            channelId: string;
            filterType: number;
        }>>;
        setChannelNotificationSettings: import("redux-actions").ActionFunction1<{
            channelsData: {
                [id: string]: number;
            };
        }, import("redux-actions").Action<{
            channelsData: {
                [id: string]: number;
            };
        }>>;
        setUserNotificationFilter: import("redux-actions").ActionFunction1<{
            filterType: number;
        }, import("redux-actions").Action<{
            filterType: number;
        }>>;
        setUserNotificationSettings: import("redux-actions").ActionFunction1<{
            userData: {
                filterType: number;
                sound: number;
            };
        }, import("redux-actions").Action<{
            userData: {
                filterType: number;
                sound: number;
            };
        }>>;
        setContactNotificationFilter: import("redux-actions").ActionFunction1<{
            contact: string;
            filterType: number;
        }, import("redux-actions").Action<{
            contact: string;
            filterType: number;
        }>>;
        setContactsNotificationSettings: import("redux-actions").ActionFunction1<{
            contacts: {
                [id: string]: number;
            };
        }, import("redux-actions").Action<{
            contacts: {
                [id: string]: number;
            };
        }>>;
        setUserNotificationSound: import("redux-actions").ActionFunction1<{
            sound: number;
        }, import("redux-actions").Action<{
            sound: number;
        }>>;
    };
    epics: {
        init: () => (dispatch: any, getState: any) => Promise<void>;
        setChannelsNotification: (filterType: any) => (dispatch: any, getState: any) => Promise<void>;
        setUserNotification: (filterType: any) => (dispatch: any) => Promise<void>;
        setContactNotification: (filterType: any) => (dispatch: any, getState: any) => Promise<void>;
        setUserNotificationsSound: (sound: any) => (dispatch: any) => Promise<void>;
        unblockUserNotification: (address: any) => (dispatch: any) => Promise<void>;
    };
    reducer: import("redux-actions").ReduxCompatibleReducer<NotificationCenter, {
        channelId: string;
        filterType: number;
    } | {
        channelsData: {
            [id: string]: number;
        };
    } | {
        filterType: number;
    } | {
        userData: {
            filterType: number;
            sound: number;
        };
    } | {
        contact: string;
        filterType: number;
    } | {
        contacts: {
            [id: string]: number;
        };
    } | {
        sound: number;
    }>;
};
export default _default;
