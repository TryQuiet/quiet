import { Dictionary, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ChannelMessage } from '../publicChannels/publicChannels.types';
import { StoreKeys } from '../store.keys';
import { MessageVerificationStatus, PublicKeyMappingPayload } from './messages.types';
export declare class MessagesState {
    publicKeyMapping: Dictionary<CryptoKey>;
    messageVerificationStatus: EntityState<MessageVerificationStatus>;
}
export declare const messagesSlice: import("@reduxjs/toolkit").Slice<{
    publicKeyMapping: Dictionary<CryptoKey>;
    messageVerificationStatus: EntityState<MessageVerificationStatus>;
}, {
    sendMessage: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>;
    addPublicKeyMapping: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, action: PayloadAction<PublicKeyMappingPayload>) => void;
    addMessageVerificationStatus: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, action: PayloadAction<MessageVerificationStatus>) => void;
    test_message_verification_status: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, action: PayloadAction<{
        message: ChannelMessage;
        verified: boolean;
    }>) => void;
}, StoreKeys.Messages>;
export declare const messagesActions: import("@reduxjs/toolkit").CaseReducerActions<{
    sendMessage: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>;
    addPublicKeyMapping: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, action: PayloadAction<PublicKeyMappingPayload>) => void;
    addMessageVerificationStatus: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, action: PayloadAction<MessageVerificationStatus>) => void;
    test_message_verification_status: (state: import("immer/dist/internal").WritableDraft<{
        publicKeyMapping: Dictionary<CryptoKey>;
        messageVerificationStatus: EntityState<MessageVerificationStatus>;
    }>, action: PayloadAction<{
        message: ChannelMessage;
        verified: boolean;
    }>) => void;
}>;
export declare const messagesReducer: import("redux").Reducer<{
    publicKeyMapping: Dictionary<CryptoKey>;
    messageVerificationStatus: EntityState<MessageVerificationStatus>;
}, import("redux").AnyAction>;
