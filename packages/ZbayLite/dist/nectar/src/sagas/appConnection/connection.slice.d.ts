import { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { CommunityId, RegistrarId } from './connection.types';
export declare type ConnectedPeers = string[];
export declare class ConnectionState {
    initializedCommunities: {
        [key: string]: boolean;
    };
    initializedRegistrars: {
        [key: string]: boolean;
    };
    connectedPeers: EntityState<string>;
}
export declare const connectionSlice: import("@reduxjs/toolkit").Slice<{
    initializedCommunities: {
        [key: string]: boolean;
    };
    initializedRegistrars: {
        [key: string]: boolean;
    };
    connectedPeers: EntityState<string>;
}, {
    addInitializedCommunity: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, action: PayloadAction<CommunityId>) => void;
    addInitializedRegistrar: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, action: PayloadAction<RegistrarId>) => void;
    removeInitializedCommunities: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, _action: PayloadAction<CommunityId>) => void;
    removeInitializedRegistrars: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, _action: PayloadAction<RegistrarId>) => void;
    addConnectedPeers: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, action: PayloadAction<ConnectedPeers>) => void;
}, StoreKeys.Connection>;
export declare const connectionActions: import("@reduxjs/toolkit").CaseReducerActions<{
    addInitializedCommunity: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, action: PayloadAction<CommunityId>) => void;
    addInitializedRegistrar: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, action: PayloadAction<RegistrarId>) => void;
    removeInitializedCommunities: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, _action: PayloadAction<CommunityId>) => void;
    removeInitializedRegistrars: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, _action: PayloadAction<RegistrarId>) => void;
    addConnectedPeers: (state: import("immer/dist/internal").WritableDraft<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: EntityState<string>;
    }>, action: PayloadAction<ConnectedPeers>) => void;
}>;
export declare const connectionReducer: import("redux").Reducer<{
    initializedCommunities: {
        [key: string]: boolean;
    };
    initializedRegistrars: {
        [key: string]: boolean;
    };
    connectedPeers: EntityState<string>;
}, import("redux").AnyAction>;
