import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  publicChannelsAdapter,
  channelMessagesAdapter,
  publicChannelsStatusAdapter,
  publicChannelsSubscriptionsAdapter
} from './publicChannels.adapter'
import {
  PublicChannelStorage,
  PublicChannelStatus,
  PublicChannelSubscription,
  ChannelMessage,
  CreateChannelPayload,
  CreatedChannelResponse,
  ChannelsReplicatedPayload,
  SendInitialChannelMessagePayload,
  SetCurrentChannelPayload,
  CacheMessagesPayload,
  MarkUnreadChannelPayload,
  SendNewUserInfoMessagePayload,
  SetChannelSubscribedPayload,
  UpdateNewestMessagePayload,
  DeleteChannelPayload,
  DeletedChannelPayload,
  DeleteChannelFromStorePayload,
  ClearMessagesCachePayload
} from './publicChannels.types'

import logger from '../../utils/logger'
import { Identity } from '../identity/identity.types'
const log = logger('publicChannels')

export class PublicChannelsState {
  public currentChannelAddress: string = 'general'

  public channels: EntityState<PublicChannelStorage> = publicChannelsAdapter.getInitialState()

  public channelsStatus: EntityState<PublicChannelStatus> =
    publicChannelsStatusAdapter.getInitialState()

  public channelsSubscriptions: EntityState<PublicChannelSubscription> =
    publicChannelsSubscriptionsAdapter.getInitialState()
}

export const publicChannelsSlice = createSlice({
  initialState: { ...new PublicChannelsState() },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, _action: PayloadAction<CreateChannelPayload>) => state,
    deleteChannel: (state, _action: PayloadAction<DeleteChannelPayload>) => state,
    deletedChannel: (state, _action: PayloadAction<DeletedChannelPayload>) => state,
    // _________________________
    deleteChannelFromStore: (state, action: PayloadAction<DeleteChannelFromStorePayload>) => {
      console.log('deleteChannelFromStore')
      const { channelAddress } = action.payload

      publicChannelsSubscriptionsAdapter.removeOne(state.channelsSubscriptions, channelAddress)
      publicChannelsStatusAdapter.removeOne(state.channelsStatus, channelAddress)
      publicChannelsAdapter.removeOne(state.channels, channelAddress)
    },
    clearMessagesCache: (state, action: PayloadAction<ClearMessagesCachePayload>) => {
      console.log('clearMessagesCache')

      const { channelAddress } = action.payload
      channelMessagesAdapter.setAll(state.channels.entities[channelAddress].messages, [])
    },
    // _________________________
    createGeneralChannel: state => state,
    sendInitialChannelMessage: (state, _action: PayloadAction<SendInitialChannelMessagePayload>) =>
      state,
    sendNewUserInfoMessage: (state, _action: PayloadAction<SendNewUserInfoMessagePayload>) => state,
    addChannel: (state, action: PayloadAction<CreatedChannelResponse>) => {
      const { channel } = action.payload
      publicChannelsAdapter.addOne(state.channels, {
        ...channel,
        messages: channelMessagesAdapter.getInitialState()
      })
      publicChannelsStatusAdapter.addOne(state.channelsStatus, {
        address: channel.address,
        unread: false,
        newestMessage: null
      })
    },
    setChannelSubscribed: (state, action: PayloadAction<SetChannelSubscribedPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsSubscriptionsAdapter.upsertOne(state.channelsSubscriptions, {
        address: channelAddress,
        subscribed: true
      })
    },
    channelsReplicated: (state, _action: PayloadAction<ChannelsReplicatedPayload>) => state,
    setCurrentChannel: (state, action: PayloadAction<SetCurrentChannelPayload>) => {
      const { channelAddress } = action.payload
      state.currentChannelAddress = channelAddress
    },
    cacheMessages: (state, action: PayloadAction<CacheMessagesPayload>) => {
      const { messages, channelAddress } = action.payload
      channelMessagesAdapter.setAll(state.channels.entities[channelAddress].messages, messages)
    },

    markUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelAddress,
        changes: {
          unread: true
        }
      })
    },
    clearUnreadChannel: (state, action: PayloadAction<MarkUnreadChannelPayload>) => {
      const { channelAddress } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: channelAddress,
        changes: {
          unread: false
        }
      })
    },
    updateNewestMessage: (state, action: PayloadAction<UpdateNewestMessagePayload>) => {
      const { message } = action.payload
      publicChannelsStatusAdapter.updateOne(state.channelsStatus, {
        id: message.channelAddress,
        changes: {
          newestMessage: message
        }
      })
    },
    // Utility action for testing purposes
    test_message: (
      state,
      action: PayloadAction<{
        message: ChannelMessage
        identity: Identity
        verifyAutomatically: boolean
      }>
    ) => {
      const { message } = action.payload
      channelMessagesAdapter.addOne(
        state.channels.entities[message.channelAddress].messages,
        message
      )
    }
  }
})

export const publicChannelsActions = publicChannelsSlice.actions
export const publicChannelsReducer = publicChannelsSlice.reducer
