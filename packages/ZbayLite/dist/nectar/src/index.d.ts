/// <reference types="packages/waggle/node_modules/@types/pkijs" />
/// <reference types="packages/identity/node_modules/@types/pkijs" />
import { useIO } from './sagas/socket/startConnection/startConnection.saga';
import { PublicChannelsState } from './sagas/publicChannels/publicChannels.slice';
import { publicChannelsMasterSaga } from './sagas/publicChannels/publicChannels.master.saga';
import { IdentityState } from './sagas/identity/identity.slice';
import { CommunitiesState } from './sagas/communities/communities.slice';
import { SocketActionTypes } from './sagas/socket/const/actionTypes';
import { StoreKeys } from './sagas/store.keys';
export { SocketActionTypes } from './sagas/socket/const/actionTypes';
export { Store } from './sagas/store.types';
export { StoreKeys } from './sagas/store.keys';
export { prepareStore } from './utils/tests/prepareStore';
export { useIO } from './sagas/socket/startConnection/startConnection.saga';
export { getFactory } from './utils/tests/factories';
export * from './utils/tests/helpers';
export * from './sagas/publicChannels/publicChannels.types';
export { Community } from './sagas/communities/communities.slice';
export { CommunityChannels } from './sagas/publicChannels/publicChannels.slice';
export * from './sagas/users/users.types';
export { communityChannelsAdapter } from './sagas/publicChannels/publicChannels.adapter';
export { communitiesAdapter } from './sagas/communities/communities.adapter';
export { publicChannelsAdapter, channelMessagesAdapter } from './sagas/publicChannels/publicChannels.adapter';
export { identityAdapter } from './sagas/identity/identity.adapter';
export * from './sagas/identity/identity.types';
export * from './sagas/communities/communities.types';
export * from './sagas/messages/messages.types';
export * from './sagas/errors/errors.types';
export declare const app: {
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        closeServices: (state: import("immer/dist/internal").WritableDraft<{}>) => import("immer/dist/internal").WritableDraft<{}>;
    }>;
};
export declare const publicChannels: {
    reducer: import("redux").Reducer<{
        channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
    }, import("redux").AnyAction>;
    State: typeof PublicChannelsState;
    selectors: {
        publicChannelsByCommunity: (id: string) => ((state: {}) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        publicChannels: ((state: {}) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.slice").CommunityChannels) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        currentChannel: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.slice").CommunityChannels) => string & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        currentChannelMessagesCount: ((state: {}) => number) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.types").ChannelMessage[]) => number & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        dailyGroupedCurrentChannelMessages: ((state: {}) => {
            [date: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[];
        }) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[]) => {
            [date: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[];
        } & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        currentChannelMessagesMergedBySender: ((state: {}) => {
            [day: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[][];
        }) & import("reselect").OutputSelectorFields<(args_0: {
            [date: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[];
        }) => {
            [day: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[][];
        } & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
    };
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        createChannel: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, _action: {
            payload: import("./sagas/publicChannels/publicChannels.types").CreateChannelPayload;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>;
        createGeneralChannel: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, _action: {
            payload: import("./sagas/publicChannels/publicChannels.types").CreateGeneralChannelPayload;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>;
        addChannel: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: import("./sagas/publicChannels/publicChannels.types").CreateChannelPayload;
            type: string;
        }) => void;
        addPublicChannelsList: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: import("./sagas/publicChannels/publicChannels.types").AddPublicChannelsListPayload;
            type: string;
        }) => void;
        responseGetPublicChannels: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: import("./sagas/publicChannels/publicChannels.types").GetPublicChannelsResponse;
            type: string;
        }) => void;
        setCurrentChannel: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: import("./sagas/publicChannels/publicChannels.types").SetCurrentChannelPayload;
            type: string;
        }) => void;
        setChannelLoadingSlice: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: import("./sagas/publicChannels/publicChannels.types").SetChannelLoadingSlicePayload;
            type: string;
        }) => void;
        subscribeToTopic: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, _action: {
            payload: import("./sagas/publicChannels/publicChannels.types").SubscribeToTopicPayload;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>;
        subscribeToAllTopics: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>;
        responseSendMessagesIds: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: import("./sagas/publicChannels/publicChannels.types").ChannelMessagesIdsResponse;
            type: string;
        }) => void;
        askForMessages: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, _action: {
            payload: import("./sagas/publicChannels/publicChannels.types").AskForMessagesPayload;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>;
        incomingMessages: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: import("./sagas/publicChannels/publicChannels.types").IncomingMessages;
            type: string;
        }) => void;
        test_message: (state: import("immer/dist/internal").WritableDraft<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }>, action: {
            payload: {
                identity: import("./sagas/identity/identity.types").Identity;
                message: import("./sagas/publicChannels/publicChannels.types").ChannelMessage;
                verifyAutomatically: boolean;
            };
            type: string;
        }) => void;
    }>;
    sagas: typeof publicChannelsMasterSaga;
};
export declare const users: {
    reducer: import("redux").Reducer<{
        certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
    }, import("redux").AnyAction>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
            certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
        }>, action: {
            payload: {
                certificate: string;
            };
            type: string;
        }) => void;
        responseSendCertificates: (state: import("immer/dist/internal").WritableDraft<{
            certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
        }>, action: {
            payload: import("./sagas/users/users.types").SendCertificatesResponse;
            type: string;
        }) => void;
    }>;
    selectors: {
        certificates: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) & import("reselect").OutputSelectorFields<(args_0: {
            certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
        }) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default> & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        certificatesMapping: ((state: {}) => {
            [pubKey: string]: import("./sagas/users/users.types").User;
        }) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) => {
            [pubKey: string]: import("./sagas/users/users.types").User;
        } & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
    };
};
export declare const identity: {
    reducer: import("redux").Reducer<{
        identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
    }, import("redux").AnyAction>;
    State: typeof IdentityState;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        addNewIdentity: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, action: {
            payload: import("./sagas/identity/identity.types").Identity;
            type: string;
        }) => void;
        createUserCsr: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, _action: {
            payload: import("./sagas/identity/identity.types").CreateUserCsrPayload;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>;
        saveOwnerCertToDb: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>;
        savedOwnerCertificate: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>;
        registerUsername: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>;
        updateUsername: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, action: {
            payload: import("./sagas/identity/identity.types").UpdateUsernamePayload;
            type: string;
        }) => void;
        storeUserCsr: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, action: {
            payload: import("./sagas/identity/identity.types").StoreUserCsrPayload;
            type: string;
        }) => void;
        storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, action: {
            payload: import("./sagas/identity/identity.types").StoreUserCertificatePayload;
            type: string;
        }) => void;
        throwIdentityError: (state: import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }>;
    }>;
    selectors: {
        selectById: (id: string) => ((state: {}) => import("./sagas/identity/identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: {
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }) => import("./sagas/identity/identity.types").Identity & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) & import("reselect").OutputSelectorFields<(args_0: {
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }) => import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity> & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        currentIdentity: ((state: {}) => import("./sagas/identity/identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: string, args_1: {
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }) => import("./sagas/identity/identity.types").Identity & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        joinedCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) => import("./sagas/communities/communities.slice").Community[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        unregisteredCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) => import("./sagas/communities/communities.slice").Community[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        unregisteredCommunitiesWithoutUserIdentity: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) => import("./sagas/communities/communities.slice").Community[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
    };
};
export declare const messages: {
    reducer: import("redux").Reducer<{
        publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
        messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
    }, import("redux").AnyAction>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        sendMessage: (state: import("immer/dist/internal").WritableDraft<{
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        }>;
        addPublicKeyMapping: (state: import("immer/dist/internal").WritableDraft<{
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        }>, action: {
            payload: import("./sagas/messages/messages.types").PublicKeyMappingPayload;
            type: string;
        }) => void;
        addMessageVerificationStatus: (state: import("immer/dist/internal").WritableDraft<{
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        }>, action: {
            payload: import("./sagas/messages/messages.types").MessageVerificationStatus;
            type: string;
        }) => void;
        test_message_verification_status: (state: import("immer/dist/internal").WritableDraft<{
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        }>, action: {
            payload: {
                message: import("./sagas/publicChannels/publicChannels.types").ChannelMessage;
                verified: boolean;
            };
            type: string;
        }) => void;
    }>;
    selectors: {
        publicKeysMapping: ((state: {}) => import("@reduxjs/toolkit").Dictionary<CryptoKey>) & import("reselect").OutputSelectorFields<(args_0: {
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        }) => import("@reduxjs/toolkit").Dictionary<CryptoKey> & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        messageVerificationStatusAdapter: import("@reduxjs/toolkit").EntityAdapter<import("./sagas/messages/messages.types").MessageVerificationStatus>;
    };
};
export declare const errors: {
    reducer: import("redux").Reducer<import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>, import("redux").AnyAction>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        addError: (state: import("immer/dist/internal").WritableDraft<import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>>, action: {
            payload: import("./sagas/errors/errors.types").ErrorPayload;
            type: string;
        }) => void;
    }>;
    selectors: {
        currentCommunityErrors: ((state: {}) => import("./sagas/errors/errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>) => import("./sagas/errors/errors.types").ErrorPayload[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        currentCommunityErrorsByType: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./sagas/errors/errors.types").ErrorPayload>) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>) => import("@reduxjs/toolkit").Dictionary<import("./sagas/errors/errors.types").ErrorPayload> & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        generalErrors: ((state: {}) => import("./sagas/errors/errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>) => import("./sagas/errors/errors.types").ErrorPayload[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
    };
};
export declare const communities: {
    reducer: import("redux").Reducer<{
        currentCommunity: string;
        communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
    }, import("redux").AnyAction>;
    State: typeof CommunitiesState;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        setCurrentCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, action: {
            payload: string;
            type: string;
        }) => void;
        addNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, action: {
            payload: import("./sagas/communities/communities.slice").Community;
            type: string;
        }) => void;
        updateCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, _action: {
            payload: Partial<import("./sagas/communities/communities.slice").Community>;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>;
        updateCommunityData: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, action: {
            payload: Partial<import("./sagas/communities/communities.slice").Community>;
            type: string;
        }) => void;
        joinCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>;
        createNetwork: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>;
        createNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>;
        responseCreateCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, _action: {
            payload: import("./sagas/communities/communities.types").ResponseCreateCommunityPayload;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>;
        responseRegistrar: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, action: {
            payload: import("./sagas/communities/communities.types").ResponseRegistrarPayload;
            type: string;
        }) => void;
        storePeerList: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, action: {
            payload: import("./sagas/communities/communities.types").StorePeerListPayload;
            type: string;
        }) => void;
        launchCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>;
        launchRegistrar: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, _action: {
            payload: string;
            type: string;
        }) => import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>;
        removeUnregisteredCommunity: (state: import("immer/dist/internal").WritableDraft<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }>, action: {
            payload: Partial<import("./sagas/communities/communities.slice").Community>;
            type: string;
        }) => void;
    }>;
    selectors: {
        selectById: (id: string) => ((state: {}) => import("./sagas/communities/communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }) => import("./sagas/communities/communities.slice").Community & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) & import("reselect").OutputSelectorFields<(args_0: {
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }) => import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community> & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        allCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) => import("./sagas/communities/communities.slice").Community[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        ownCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) => import("./sagas/communities/communities.slice").Community[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        currentCommunityId: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: {
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }) => string & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        currentCommunity: ((state: {}) => import("./sagas/communities/communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }) => import("./sagas/communities/communities.slice").Community & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        registrarUrl: (communityId: string) => ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) => string & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        isOwner: ((state: {}) => boolean) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community) => boolean & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
    };
};
export declare const connection: {
    reducer: import("redux").Reducer<{
        initializedCommunities: {
            [key: string]: boolean;
        };
        initializedRegistrars: {
            [key: string]: boolean;
        };
        connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
    }, import("redux").AnyAction>;
    actions: import("@reduxjs/toolkit").CaseReducerActions<{
        addInitializedCommunity: (state: import("immer/dist/internal").WritableDraft<{
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }>, action: {
            payload: string;
            type: string;
        }) => void;
        addInitializedRegistrar: (state: import("immer/dist/internal").WritableDraft<{
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }>, action: {
            payload: string;
            type: string;
        }) => void;
        removeInitializedCommunities: (state: import("immer/dist/internal").WritableDraft<{
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }>, _action: {
            payload: string;
            type: string;
        }) => void;
        removeInitializedRegistrars: (state: import("immer/dist/internal").WritableDraft<{
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }>, _action: {
            payload: string;
            type: string;
        }) => void;
        addConnectedPeers: (state: import("immer/dist/internal").WritableDraft<{
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }>, action: {
            payload: import("./sagas/appConnection/connection.slice").ConnectedPeers;
            type: string;
        }) => void;
    }>;
    selectors: {
        initializedCommunities: ((state: {}) => {
            [key: string]: boolean;
        }) & import("reselect").OutputSelectorFields<(args_0: {
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }) => {
            [key: string]: boolean;
        } & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        initializedRegistrars: ((state: {}) => {
            [key: string]: boolean;
        }) & import("reselect").OutputSelectorFields<(args_0: {
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }) => {
            [key: string]: boolean;
        } & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        connectedPeers: ((state: {}) => string[]) & import("reselect").OutputSelectorFields<(args_0: {
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }) => string[] & {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
        connectedPeersMapping: ((state: {}) => {}) & import("reselect").OutputSelectorFields<(args_0: {
            [pubKey: string]: import("./sagas/users/users.types").User;
        }, args_1: string[]) => {
            clearCache: () => void;
        }> & {
            clearCache: () => void;
        };
    };
};
export declare const socket: {
    useIO: typeof useIO;
};
export declare const storeKeys: typeof StoreKeys;
export declare const socketActionTypes: typeof SocketActionTypes;
declare const _default: {
    app: {
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            closeServices: (state: import("immer/dist/internal").WritableDraft<{}>) => import("immer/dist/internal").WritableDraft<{}>;
        }>;
    };
    publicChannels: {
        reducer: import("redux").Reducer<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }, import("redux").AnyAction>;
        State: typeof PublicChannelsState;
        selectors: {
            publicChannelsByCommunity: (id: string) => ((state: {}) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            publicChannels: ((state: {}) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.slice").CommunityChannels) => import("./sagas/publicChannels/publicChannels.types").PublicChannel[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            currentChannel: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.slice").CommunityChannels) => string & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            currentChannelMessagesCount: ((state: {}) => number) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.types").ChannelMessage[]) => number & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            dailyGroupedCurrentChannelMessages: ((state: {}) => {
                [date: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[];
            }) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[]) => {
                [date: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[];
            } & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            currentChannelMessagesMergedBySender: ((state: {}) => {
                [day: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[][];
            }) & import("reselect").OutputSelectorFields<(args_0: {
                [date: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[];
            }) => {
                [day: string]: import("./sagas/publicChannels/publicChannels.types").DisplayableMessage[][];
            } & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
        };
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            createChannel: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, _action: {
                payload: import("./sagas/publicChannels/publicChannels.types").CreateChannelPayload;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>;
            createGeneralChannel: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, _action: {
                payload: import("./sagas/publicChannels/publicChannels.types").CreateGeneralChannelPayload;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>;
            addChannel: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: import("./sagas/publicChannels/publicChannels.types").CreateChannelPayload;
                type: string;
            }) => void;
            addPublicChannelsList: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: import("./sagas/publicChannels/publicChannels.types").AddPublicChannelsListPayload;
                type: string;
            }) => void;
            responseGetPublicChannels: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: import("./sagas/publicChannels/publicChannels.types").GetPublicChannelsResponse;
                type: string;
            }) => void;
            setCurrentChannel: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: import("./sagas/publicChannels/publicChannels.types").SetCurrentChannelPayload;
                type: string;
            }) => void;
            setChannelLoadingSlice: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: import("./sagas/publicChannels/publicChannels.types").SetChannelLoadingSlicePayload;
                type: string;
            }) => void;
            subscribeToTopic: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, _action: {
                payload: import("./sagas/publicChannels/publicChannels.types").SubscribeToTopicPayload;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>;
            subscribeToAllTopics: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>;
            responseSendMessagesIds: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: import("./sagas/publicChannels/publicChannels.types").ChannelMessagesIdsResponse;
                type: string;
            }) => void;
            askForMessages: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, _action: {
                payload: import("./sagas/publicChannels/publicChannels.types").AskForMessagesPayload;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>;
            incomingMessages: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: import("./sagas/publicChannels/publicChannels.types").IncomingMessages;
                type: string;
            }) => void;
            test_message: (state: import("immer/dist/internal").WritableDraft<{
                channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
            }>, action: {
                payload: {
                    identity: import("./sagas/identity/identity.types").Identity;
                    message: import("./sagas/publicChannels/publicChannels.types").ChannelMessage;
                    verifyAutomatically: boolean;
                };
                type: string;
            }) => void;
        }>;
        sagas: typeof publicChannelsMasterSaga;
    };
    users: {
        reducer: import("redux").Reducer<{
            certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
        }, import("redux").AnyAction>;
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
                certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
            }>, action: {
                payload: {
                    certificate: string;
                };
                type: string;
            }) => void;
            responseSendCertificates: (state: import("immer/dist/internal").WritableDraft<{
                certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
            }>, action: {
                payload: import("./sagas/users/users.types").SendCertificatesResponse;
                type: string;
            }) => void;
        }>;
        selectors: {
            certificates: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) & import("reselect").OutputSelectorFields<(args_0: {
                certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
            }) => import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default> & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            certificatesMapping: ((state: {}) => {
                [pubKey: string]: import("./sagas/users/users.types").User;
            }) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("pkijs/src/Certificate").default>) => {
                [pubKey: string]: import("./sagas/users/users.types").User;
            } & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
        };
    };
    identity: {
        reducer: import("redux").Reducer<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }, import("redux").AnyAction>;
        State: typeof IdentityState;
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            addNewIdentity: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, action: {
                payload: import("./sagas/identity/identity.types").Identity;
                type: string;
            }) => void;
            createUserCsr: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, _action: {
                payload: import("./sagas/identity/identity.types").CreateUserCsrPayload;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>;
            saveOwnerCertToDb: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>;
            savedOwnerCertificate: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>;
            registerUsername: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>;
            updateUsername: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, action: {
                payload: import("./sagas/identity/identity.types").UpdateUsernamePayload;
                type: string;
            }) => void;
            storeUserCsr: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, action: {
                payload: import("./sagas/identity/identity.types").StoreUserCsrPayload;
                type: string;
            }) => void;
            storeUserCertificate: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, action: {
                payload: import("./sagas/identity/identity.types").StoreUserCertificatePayload;
                type: string;
            }) => void;
            throwIdentityError: (state: import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }>;
        }>;
        selectors: {
            selectById: (id: string) => ((state: {}) => import("./sagas/identity/identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: {
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }) => import("./sagas/identity/identity.types").Identity & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) & import("reselect").OutputSelectorFields<(args_0: {
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }) => import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity> & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            currentIdentity: ((state: {}) => import("./sagas/identity/identity.types").Identity) & import("reselect").OutputSelectorFields<(args_0: string, args_1: {
                identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
            }) => import("./sagas/identity/identity.types").Identity & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            joinedCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) => import("./sagas/communities/communities.slice").Community[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            unregisteredCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) => import("./sagas/communities/communities.slice").Community[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            unregisteredCommunitiesWithoutUserIdentity: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community[], args_1: import("@reduxjs/toolkit").Dictionary<import("./sagas/identity/identity.types").Identity>) => import("./sagas/communities/communities.slice").Community[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
        };
    };
    messages: {
        reducer: import("redux").Reducer<{
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        }, import("redux").AnyAction>;
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            sendMessage: (state: import("immer/dist/internal").WritableDraft<{
                publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
                messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
                messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
            }>;
            addPublicKeyMapping: (state: import("immer/dist/internal").WritableDraft<{
                publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
                messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
            }>, action: {
                payload: import("./sagas/messages/messages.types").PublicKeyMappingPayload;
                type: string;
            }) => void;
            addMessageVerificationStatus: (state: import("immer/dist/internal").WritableDraft<{
                publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
                messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
            }>, action: {
                payload: import("./sagas/messages/messages.types").MessageVerificationStatus;
                type: string;
            }) => void;
            test_message_verification_status: (state: import("immer/dist/internal").WritableDraft<{
                publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
                messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
            }>, action: {
                payload: {
                    message: import("./sagas/publicChannels/publicChannels.types").ChannelMessage;
                    verified: boolean;
                };
                type: string;
            }) => void;
        }>;
        selectors: {
            publicKeysMapping: ((state: {}) => import("@reduxjs/toolkit").Dictionary<CryptoKey>) & import("reselect").OutputSelectorFields<(args_0: {
                publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
                messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
            }) => import("@reduxjs/toolkit").Dictionary<CryptoKey> & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            messageVerificationStatusAdapter: import("@reduxjs/toolkit").EntityAdapter<import("./sagas/messages/messages.types").MessageVerificationStatus>;
        };
    };
    errors: {
        reducer: import("redux").Reducer<import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>, import("redux").AnyAction>;
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            addError: (state: import("immer/dist/internal").WritableDraft<import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>>, action: {
                payload: import("./sagas/errors/errors.types").ErrorPayload;
                type: string;
            }) => void;
        }>;
        selectors: {
            currentCommunityErrors: ((state: {}) => import("./sagas/errors/errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>) => import("./sagas/errors/errors.types").ErrorPayload[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            currentCommunityErrorsByType: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./sagas/errors/errors.types").ErrorPayload>) & import("reselect").OutputSelectorFields<(args_0: string, args_1: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>) => import("@reduxjs/toolkit").Dictionary<import("./sagas/errors/errors.types").ErrorPayload> & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            generalErrors: ((state: {}) => import("./sagas/errors/errors.types").ErrorPayload[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>) => import("./sagas/errors/errors.types").ErrorPayload[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
        };
    };
    communities: {
        reducer: import("redux").Reducer<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }, import("redux").AnyAction>;
        State: typeof CommunitiesState;
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            setCurrentCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, action: {
                payload: string;
                type: string;
            }) => void;
            addNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, action: {
                payload: import("./sagas/communities/communities.slice").Community;
                type: string;
            }) => void;
            updateCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, _action: {
                payload: Partial<import("./sagas/communities/communities.slice").Community>;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>;
            updateCommunityData: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, action: {
                payload: Partial<import("./sagas/communities/communities.slice").Community>;
                type: string;
            }) => void;
            joinCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>;
            createNetwork: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>;
            createNewCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>;
            responseCreateCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, _action: {
                payload: import("./sagas/communities/communities.types").ResponseCreateCommunityPayload;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>;
            responseRegistrar: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, action: {
                payload: import("./sagas/communities/communities.types").ResponseRegistrarPayload;
                type: string;
            }) => void;
            storePeerList: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, action: {
                payload: import("./sagas/communities/communities.types").StorePeerListPayload;
                type: string;
            }) => void;
            launchCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>;
            launchRegistrar: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, _action: {
                payload: string;
                type: string;
            }) => import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>;
            removeUnregisteredCommunity: (state: import("immer/dist/internal").WritableDraft<{
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }>, action: {
                payload: Partial<import("./sagas/communities/communities.slice").Community>;
                type: string;
            }) => void;
        }>;
        selectors: {
            selectById: (id: string) => ((state: {}) => import("./sagas/communities/communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }) => import("./sagas/communities/communities.slice").Community & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            selectEntities: ((state: {}) => import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) & import("reselect").OutputSelectorFields<(args_0: {
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }) => import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community> & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            allCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) => import("./sagas/communities/communities.slice").Community[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            ownCommunities: ((state: {}) => import("./sagas/communities/communities.slice").Community[]) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) => import("./sagas/communities/communities.slice").Community[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            currentCommunityId: ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: {
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }) => string & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            currentCommunity: ((state: {}) => import("./sagas/communities/communities.slice").Community) & import("reselect").OutputSelectorFields<(args_0: {
                currentCommunity: string;
                communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
            }) => import("./sagas/communities/communities.slice").Community & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            registrarUrl: (communityId: string) => ((state: {}) => string) & import("reselect").OutputSelectorFields<(args_0: import("@reduxjs/toolkit").Dictionary<import("./sagas/communities/communities.slice").Community>) => string & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            isOwner: ((state: {}) => boolean) & import("reselect").OutputSelectorFields<(args_0: import("./sagas/communities/communities.slice").Community) => boolean & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
        };
    };
    connection: {
        reducer: import("redux").Reducer<{
            initializedCommunities: {
                [key: string]: boolean;
            };
            initializedRegistrars: {
                [key: string]: boolean;
            };
            connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
        }, import("redux").AnyAction>;
        actions: import("@reduxjs/toolkit").CaseReducerActions<{
            addInitializedCommunity: (state: import("immer/dist/internal").WritableDraft<{
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }>, action: {
                payload: string;
                type: string;
            }) => void;
            addInitializedRegistrar: (state: import("immer/dist/internal").WritableDraft<{
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }>, action: {
                payload: string;
                type: string;
            }) => void;
            removeInitializedCommunities: (state: import("immer/dist/internal").WritableDraft<{
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }>, _action: {
                payload: string;
                type: string;
            }) => void;
            removeInitializedRegistrars: (state: import("immer/dist/internal").WritableDraft<{
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }>, _action: {
                payload: string;
                type: string;
            }) => void;
            addConnectedPeers: (state: import("immer/dist/internal").WritableDraft<{
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }>, action: {
                payload: import("./sagas/appConnection/connection.slice").ConnectedPeers;
                type: string;
            }) => void;
        }>;
        selectors: {
            initializedCommunities: ((state: {}) => {
                [key: string]: boolean;
            }) & import("reselect").OutputSelectorFields<(args_0: {
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }) => {
                [key: string]: boolean;
            } & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            initializedRegistrars: ((state: {}) => {
                [key: string]: boolean;
            }) & import("reselect").OutputSelectorFields<(args_0: {
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }) => {
                [key: string]: boolean;
            } & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            connectedPeers: ((state: {}) => string[]) & import("reselect").OutputSelectorFields<(args_0: {
                initializedCommunities: {
                    [key: string]: boolean;
                };
                initializedRegistrars: {
                    [key: string]: boolean;
                };
                connectedPeers: import("@reduxjs/toolkit").EntityState<string>;
            }) => string[] & {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
            connectedPeersMapping: ((state: {}) => {}) & import("reselect").OutputSelectorFields<(args_0: {
                [pubKey: string]: import("./sagas/users/users.types").User;
            }, args_1: string[]) => {
                clearCache: () => void;
            }> & {
                clearCache: () => void;
            };
        };
    };
    reducers: {
        PublicChannels: import("redux").Reducer<{
            channels: import("@reduxjs/toolkit").EntityState<import("./sagas/publicChannels/publicChannels.slice").CommunityChannels>;
        }, import("redux").AnyAction>;
        Users: import("redux").Reducer<{
            certificates: import("@reduxjs/toolkit").EntityState<import("pkijs/src/Certificate").default>;
        }, import("redux").AnyAction>;
        Communities: import("redux").Reducer<{
            currentCommunity: string;
            communities: import("@reduxjs/toolkit").EntityState<import("./sagas/communities/communities.slice").Community>;
        }, import("redux").AnyAction>;
        Identity: import("redux").Reducer<{
            identities: import("@reduxjs/toolkit").EntityState<import("./sagas/identity/identity.types").Identity>;
        }, import("redux").AnyAction>;
        Errors: import("redux").Reducer<import("@reduxjs/toolkit").Dictionary<import("@reduxjs/toolkit").EntityState<import("./sagas/errors/errors.types").ErrorPayload>>, import("redux").AnyAction>;
        Messages: import("redux").Reducer<{
            publicKeyMapping: import("@reduxjs/toolkit").Dictionary<CryptoKey>;
            messageVerificationStatus: import("@reduxjs/toolkit").EntityState<import("./sagas/messages/messages.types").MessageVerificationStatus>;
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
    storeKeys: typeof StoreKeys;
    socketActionTypes: typeof SocketActionTypes;
};
export default _default;
