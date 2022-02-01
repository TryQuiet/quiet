import { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { PublicChannel, ChannelMessage, CreateChannelPayload, CreateGeneralChannelPayload, AddPublicChannelsListPayload, GetPublicChannelsResponse, SetCurrentChannelPayload, SetChannelLoadingSlicePayload, ChannelMessagesIdsResponse, SubscribeToTopicPayload, AskForMessagesPayload, IncomingMessages } from './publicChannels.types';
import { Identity } from '../identity/identity.types';
export declare class PublicChannelsState {
    channels: EntityState<CommunityChannels>;
}
export interface CommunityChannels {
    id: string;
    currentChannel: string;
    channels: EntityState<PublicChannel>;
    channelMessages: EntityState<ChannelMessage>;
    channelLoadingSlice: number;
}
export declare const publicChannelsSlice: import("@reduxjs/toolkit").Slice<{
    channels: EntityState<CommunityChannels>;
}, {
    createChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<CreateChannelPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    createGeneralChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<CreateGeneralChannelPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    addChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<CreateChannelPayload>) => void;
    addPublicChannelsList: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<AddPublicChannelsListPayload>) => void;
    responseGetPublicChannels: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<GetPublicChannelsResponse>) => void;
    setCurrentChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<SetCurrentChannelPayload>) => void;
    setChannelLoadingSlice: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<SetChannelLoadingSlicePayload>) => void;
    subscribeToTopic: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<SubscribeToTopicPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    subscribeToAllTopics: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    responseSendMessagesIds: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<ChannelMessagesIdsResponse>) => void;
    askForMessages: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<AskForMessagesPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    incomingMessages: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<IncomingMessages>) => void;
    test_message: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<{
        identity: Identity;
        message: ChannelMessage;
        verifyAutomatically: boolean;
    }>) => void;
}, StoreKeys.PublicChannels>;
export declare const publicChannelsActions: import("@reduxjs/toolkit").CaseReducerActions<{
    createChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<CreateChannelPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    createGeneralChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<CreateGeneralChannelPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    addChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<CreateChannelPayload>) => void;
    addPublicChannelsList: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<AddPublicChannelsListPayload>) => void;
    responseGetPublicChannels: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<GetPublicChannelsResponse>) => void;
    setCurrentChannel: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<SetCurrentChannelPayload>) => void;
    setChannelLoadingSlice: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<SetChannelLoadingSlicePayload>) => void;
    subscribeToTopic: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<SubscribeToTopicPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    subscribeToAllTopics: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<string>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    responseSendMessagesIds: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<ChannelMessagesIdsResponse>) => void;
    askForMessages: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, _action: PayloadAction<AskForMessagesPayload>) => import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>;
    incomingMessages: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<IncomingMessages>) => void;
    test_message: (state: import("immer/dist/internal").WritableDraft<{
        channels: EntityState<CommunityChannels>;
    }>, action: PayloadAction<{
        identity: Identity;
        message: ChannelMessage;
        verifyAutomatically: boolean;
    }>) => void;
}>;
export declare const publicChannelsReducer: import("redux").Reducer<{
    channels: EntityState<CommunityChannels>;
}, import("redux").AnyAction>;
