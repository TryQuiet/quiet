/// <reference types="packages/waggle/node_modules/@types/pkijs" />
/// <reference types="packages/identity/node_modules/@types/pkijs" />
import { StoreKeys } from '../../sagas/store.keys';
export declare const prepareStore: (mockedState?: {
    NativeServices?: any;
    Init?: any;
    Assets?: any;
    Socket?: any;
    Identity?: any;
    PublicChannels?: any;
    Messages?: any;
    Modals?: any;
    Users?: any;
    Errors?: any;
    Communities?: any;
    App?: any;
    Connection?: any;
}) => {
    store: import("redux").Store<import("redux").EmptyObject & {
        Communities: {
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("../../sagas/communities/communities.slice").Community>;
        };
        Identity: {
            identities: import("@reduxjs/toolkit").EntityState<import("../..").Identity>;
        };
        Users: {
            certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
        };
        Errors: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("../..").ErrorPayload>>;
        Messages: {
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("../..").MessageVerificationStatus>;
        };
        PublicChannels: {
            channels: import("@reduxjs/toolkit").EntityState<import("../../sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        };
        Connection: {
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        };
    }, import("redux").AnyAction> & {
        dispatch: unknown;
    };
    runSaga: <S extends import("redux-saga").Saga<any[]>>(saga: S, ...args: Parameters<S>) => import("redux-saga").Task;
};
