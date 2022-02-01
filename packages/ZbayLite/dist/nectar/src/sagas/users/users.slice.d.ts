import { EntityState, PayloadAction } from '@reduxjs/toolkit';
import Certificate from 'pkijs/src/Certificate';
import { StoreKeys } from '../store.keys';
import { SendCertificatesResponse } from './users.types';
export declare class UsersState {
    certificates: EntityState<Certificate>;
}
export declare const usersSlice: import("@reduxjs/toolkit").Slice<{
    certificates: EntityState<Certificate>;
}, {
    storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
        certificates: EntityState<Certificate>;
    }>, action: PayloadAction<{
        certificate: string;
    }>) => void;
    responseSendCertificates: (state: import("immer/dist/internal").WritableDraft<{
        certificates: EntityState<Certificate>;
    }>, action: PayloadAction<SendCertificatesResponse>) => void;
}, StoreKeys.Users>;
export declare const usersActions: import("@reduxjs/toolkit").CaseReducerActions<{
    storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
        certificates: EntityState<Certificate>;
    }>, action: PayloadAction<{
        certificate: string;
    }>) => void;
    responseSendCertificates: (state: import("immer/dist/internal").WritableDraft<{
        certificates: EntityState<Certificate>;
    }>, action: PayloadAction<SendCertificatesResponse>) => void;
}>;
export declare const usersReducer: import("redux").Reducer<{
    certificates: EntityState<Certificate>;
}, import("redux").AnyAction>;
