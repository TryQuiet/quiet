import { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { CreateUserCsrPayload, Identity, StoreUserCertificatePayload, StoreUserCsrPayload, UpdateUsernamePayload } from './identity.types';
export declare class IdentityState {
    identities: EntityState<Identity>;
}
export declare const identitySlice: import("@reduxjs/toolkit").Slice<{
    identities: EntityState<Identity>;
}, {
    addNewIdentity: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<Identity>) => void;
    createUserCsr: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<CreateUserCsrPayload>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    saveOwnerCertToDb: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    savedOwnerCertificate: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    registerUsername: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    updateUsername: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<UpdateUsernamePayload>) => void;
    storeUserCsr: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<StoreUserCsrPayload>) => void;
    storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<StoreUserCertificatePayload>) => void;
    throwIdentityError: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
}, StoreKeys.Identity>;
export declare const identityActions: import("@reduxjs/toolkit").CaseReducerActions<{
    addNewIdentity: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<Identity>) => void;
    createUserCsr: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<CreateUserCsrPayload>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    saveOwnerCertToDb: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    savedOwnerCertificate: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    registerUsername: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
    updateUsername: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<UpdateUsernamePayload>) => void;
    storeUserCsr: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<StoreUserCsrPayload>) => void;
    storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, action: PayloadAction<StoreUserCertificatePayload>) => void;
    throwIdentityError: (state: import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        identities: EntityState<Identity>;
    }>;
}>;
export declare const identityReducer: import("redux").Reducer<{
    identities: EntityState<Identity>;
}, import("redux").AnyAction>;
