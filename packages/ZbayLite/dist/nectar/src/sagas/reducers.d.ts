/// <reference types="packages/waggle/node_modules/@types/pkijs" />
/// <reference types="packages/identity/node_modules/@types/pkijs" />
export declare const reducers: {
    PublicChannels: import("redux").Reducer<{
        channels: import("@reduxjs/toolkit").EntityState<import("./publicChannels/publicChannels.slice").CommunityChannels>;
    }, import("redux").AnyAction>;
    Users: import("redux").Reducer<{
        certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
    }, import("redux").AnyAction>;
    Communities: import("redux").Reducer<{
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("./communities/communities.slice").Community>;
    }, import("redux").AnyAction>;
    Identity: import("redux").Reducer<{
        identities: import("@reduxjs/toolkit").EntityState<import("..").Identity>;
    }, import("redux").AnyAction>;
    Errors: import("redux").Reducer<import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("..").ErrorPayload>>, import("redux").AnyAction>;
    Messages: import("redux").Reducer<{
        publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
        messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("..").MessageVerificationStatus>;
    }, import("redux").AnyAction>;
    Connection: import("redux").Reducer<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
    }, import("redux").AnyAction>;
};
