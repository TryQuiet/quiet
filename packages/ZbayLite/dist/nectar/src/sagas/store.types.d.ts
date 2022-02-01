/// <reference types="packages/waggle/node_modules/@types/pkijs" />
/// <reference types="packages/identity/node_modules/@types/pkijs" />
declare const rootReducer: import("redux").Reducer<import("redux").CombinedState<{
    PublicChannels: {
        channels: import("@reduxjs/toolkit").EntityState<import("..").CommunityChannels>;
    };
    Users: {
        certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
    };
    Communities: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("..").Community>;
    };
    Identity: {
        identities: import("@reduxjs/toolkit").EntityState<import("..").Identity>;
    };
    Errors: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("..").ErrorPayload>>;
    Messages: {
        publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
        messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("..").MessageVerificationStatus>;
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
}>, import("redux").AnyAction>;
declare const store: import("@reduxjs/toolkit").EnhancedStore<import("redux").CombinedState<{
    PublicChannels: {
        channels: import("@reduxjs/toolkit").EntityState<import("..").CommunityChannels>;
    };
    Users: {
        certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
    };
    Communities: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("..").Community>;
    };
    Identity: {
        identities: import("@reduxjs/toolkit").EntityState<import("..").Identity>;
    };
    Errors: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("..").ErrorPayload>>;
    Messages: {
        publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
        messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("..").MessageVerificationStatus>;
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
}>, import("redux").AnyAction, [import("redux-thunk").ThunkMiddleware<import("redux").CombinedState<{
    PublicChannels: {
        channels: import("@reduxjs/toolkit").EntityState<import("..").CommunityChannels>;
    };
    Users: {
        certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
    };
    Communities: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("..").Community>;
    };
    Identity: {
        identities: import("@reduxjs/toolkit").EntityState<import("..").Identity>;
    };
    Errors: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("..").ErrorPayload>>;
    Messages: {
        publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
        messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("..").MessageVerificationStatus>;
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
}>, import("redux").AnyAction, null> | import("redux-thunk").ThunkMiddleware<import("redux").CombinedState<{
    PublicChannels: {
        channels: import("@reduxjs/toolkit").EntityState<import("..").CommunityChannels>;
    };
    Users: {
        certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
    };
    Communities: {
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("..").Community>;
    };
    Identity: {
        identities: import("@reduxjs/toolkit").EntityState<import("..").Identity>;
    };
    Errors: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("..").ErrorPayload>>;
    Messages: {
        publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
        messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("..").MessageVerificationStatus>;
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
}>, import("redux").AnyAction, undefined>]>;
export declare type Store = typeof store;
export declare type StoreState = ReturnType<typeof rootReducer>;
export declare type StoreDispatch = typeof store.dispatch;
export declare type CreatedSelectors = {
    [Key in keyof StoreState]: (state: StoreState) => StoreState[Key];
};
export declare type StoreModuleStateClass = new () => object;
export {};
