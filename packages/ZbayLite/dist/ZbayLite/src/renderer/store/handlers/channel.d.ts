import BigNumber from 'bignumber.js';
import { ActionsType } from './types';
export declare const ChannelState: {
    spentFilterValue: BigNumber;
    id: any;
    message: {};
    shareableUri: string;
    address: string;
    loader: {
        loading: boolean;
        message: string;
    };
    members: any;
    showInfoMsg: boolean;
    isSizeCheckingInProgress: boolean;
    messageSizeStatus: any;
    displayableMessageLimit: number;
};
interface ILoader {
    loading: boolean;
    message?: string;
}
export declare class Channel {
    spentFilterValue?: BigNumber;
    id?: string;
    message?: object;
    shareableUri?: string;
    address?: string;
    loader?: ILoader;
    members?: object;
    showInfoMsg?: boolean;
    isSizeCheckingInProgress?: boolean;
    messageSizeStatus?: boolean;
    displayableMessageLimit: number;
    name?: string;
    description?: string;
    constructor(values?: Partial<Channel>);
}
export declare const initialState: Channel;
export declare const actions: {
    setLoading: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
    setSpentFilterValue: import("redux-actions").ActionFunction2<any, any, import("redux-actions").Action<any>>;
    setMessage: import("redux-actions").ActionFunction1<{
        value: string;
        id: string;
    }, import("redux-actions").Action<{
        value: string;
        id: string;
    }>>;
    setShareableUri: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    setChannelId: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    resetChannel: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
    isSizeCheckingInProgress: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
    setAddress: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
    messageSizeStatus: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
    setDisplayableLimit: import("redux-actions").ActionFunction1<number, import("redux-actions").Action<number>>;
};
export declare type ChannelActions = ActionsType<typeof actions>;
export declare const reducer: import("redux-actions").ReduxCompatibleReducer<Channel, any>;
export declare const epics: {
    loadChannel: (key: any) => (dispatch: any, getState: any) => Promise<void>;
    clearNewMessages: () => (_dispatch: any, _getState: any) => Promise<void>;
    linkChannelRedirect: (targetChannel: any) => (dispatch: any, _getState: any) => Promise<void>;
};
declare const _default: {
    reducer: import("redux-actions").ReduxCompatibleReducer<Channel, any>;
    epics: {
        loadChannel: (key: any) => (dispatch: any, getState: any) => Promise<void>;
        clearNewMessages: () => (_dispatch: any, _getState: any) => Promise<void>;
        linkChannelRedirect: (targetChannel: any) => (dispatch: any, _getState: any) => Promise<void>;
    };
    actions: {
        setLoading: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
        setSpentFilterValue: import("redux-actions").ActionFunction2<any, any, import("redux-actions").Action<any>>;
        setMessage: import("redux-actions").ActionFunction1<{
            value: string;
            id: string;
        }, import("redux-actions").Action<{
            value: string;
            id: string;
        }>>;
        setShareableUri: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
        setChannelId: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
        resetChannel: import("redux-actions").ActionFunctionAny<import("redux-actions").Action<any>>;
        isSizeCheckingInProgress: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
        setAddress: import("redux-actions").ActionFunction1<string, import("redux-actions").Action<string>>;
        messageSizeStatus: import("redux-actions").ActionFunction1<boolean, import("redux-actions").Action<boolean>>;
        setDisplayableLimit: import("redux-actions").ActionFunction1<number, import("redux-actions").Action<number>>;
    };
};
export default _default;
