import { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { ResponseCreateCommunityPayload, ResponseRegistrarPayload, StorePeerListPayload } from './communities.types';
export declare class CommunitiesState {
    currentCommunity: string;
    communities: EntityState<Community>;
}
export interface Community {
    id: string;
    name: string;
    CA: null | {
        rootCertString: string;
        rootKeyString: string;
    };
    rootCa: string;
    peerList: string[];
    registrarUrl: string;
    registrar: null | {
        privateKey: string;
        address: string;
    };
    onionAddress: string;
    privateKey: string;
    port: number;
}
export declare const communitiesSlice: import("@reduxjs/toolkit").Slice<{
    currentCommunity: string;
    communities: EntityState<Community>;
}, {
    setCurrentCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<string>) => void;
    addNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<Community>) => void;
    updateCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<Partial<Community>>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    updateCommunityData: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<Partial<Community>>) => void;
    joinCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    createNetwork: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    createNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    responseCreateCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<ResponseCreateCommunityPayload>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    responseRegistrar: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<ResponseRegistrarPayload>) => void;
    storePeerList: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<StorePeerListPayload>) => void;
    launchCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    launchRegistrar: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    removeUnregisteredCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<Partial<Community>>) => void;
}, StoreKeys.Communities>;
export declare const communitiesActions: import("@reduxjs/toolkit").CaseReducerActions<{
    setCurrentCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<string>) => void;
    addNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<Community>) => void;
    updateCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<Partial<Community>>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    updateCommunityData: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<Partial<Community>>) => void;
    joinCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    createNetwork: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    createNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    responseCreateCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<ResponseCreateCommunityPayload>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    responseRegistrar: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<ResponseRegistrarPayload>) => void;
    storePeerList: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<StorePeerListPayload>) => void;
    launchCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    launchRegistrar: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>;
    removeUnregisteredCommunity: (state: import("immer/dist/internal").WritableDraft<{
        currentCommunity: string;
        communities: EntityState<Community>;
    }>, action: PayloadAction<Partial<Community>>) => void;
}>;
export declare const communitiesReducer: import("redux").Reducer<{
    currentCommunity: string;
    communities: EntityState<Community>;
}, import("redux").AnyAction>;
