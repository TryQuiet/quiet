import { displayMessageNotificationSaga } from './notifications'
import { expectSaga } from 'redux-saga-test-plan'
import { channelMessagesAdapter, communities, CommunityChannels, communityChannelsAdapter, getFactory, identity, NotificationsOptions, NotificationsSounds, prepareStore, PublicChannel, publicChannels, publicChannelsAdapter, settings, StoreKeys, users } from '@quiet/nectar'
import { combineReducers } from '@reduxjs/toolkit'
import { setupCrypto } from '@quiet/identity'
import { remote } from 'electron'
import create from './store/create'

const originalNotification = window.Notification
const mockNotification = jest.fn()
const mockDispatch = jest.fn()

const notification = jest.fn().mockImplementation(() => { return mockNotification })

jest.mock('./store/create', () => { return () => ({ dispatch: mockDispatch }) })

const mockShow = jest.fn()
let mockIsFocused = jest.fn()

jest.mock('electron', () => {
  return {
    remote:
    {
      BrowserWindow: {
        getAllWindows: () => {
          return [{
            show: mockShow,
            isFocused: mockIsFocused
          }]
        }
      }
    }
  }
})



// @ts-ignore
window.Notification = notification

afterAll(() => {
  window.Notification = originalNotification
})

afterEach(() => {
  notification.mockClear()
  mockShow.mockClear()
  mockIsFocused.mockClear()
})

describe('displayNotificationsSaga', () => {
  test('display notification when the user is on a different channel and settings are set on show every notification and push to the right channel', async () => {
    setupCrypto()
    const store = prepareStore().store
    const factory = await getFactory(store)

    const community1 = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community1.id, nickname: 'alice' })

    const incomingMessagesChannelId = 'channelId'

    const incomingMessages = {
      messages: [{
        id: 'id',
        type: 1,
        message: 'message',
        createdAt: 1000000,
        channelId: incomingMessagesChannelId,
        signature: 'signature',
        pubKey: 'pubKey'
      }],
      communityId: community1.id
    }

    const publicChannel: PublicChannel = {
      name: 'general',
      description: 'description',
      owner: 'user',
      timestamp: 0,
      address: 'general'
    }

    const publicChannel2: PublicChannel = {
      name: incomingMessagesChannelId,
      description: 'description',
      owner: 'user',
      timestamp: 0,
      address: incomingMessagesChannelId
    }

    const communityChannels: CommunityChannels = {
      id: community1.id,
      currentChannel: publicChannel.address,
      channels: publicChannelsAdapter.setAll(
        publicChannelsAdapter.getInitialState(),
        [publicChannel, publicChannel2]
      ),
      channelMessages: channelMessagesAdapter.getInitialState(),
      channelLoadingSlice: 0
    }

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages))
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer

        }),
        {
          [StoreKeys.Identity]: store.getState().Identity,
          [StoreKeys.Settings]: {
            ...new settings.State(),
            notificationsOption: NotificationsOptions.notifyForEveryMessage
          },
          [StoreKeys.PublicChannels]: {
            ...new publicChannels.State(),
            channels: communityChannelsAdapter.setAll(
              communityChannelsAdapter.getInitialState(),
              [communityChannels]
            )
          },
          [StoreKeys.Users]: { ...new users.State() },
          [StoreKeys.Communities]: store.getState().Communities
        }
      )
      .run()

    expect(notification).toBeCalledWith(
      `New message in ${incomingMessagesChannelId}`,
      { body: incomingMessages.messages[0].message }
    )
    // simulate click on notification
    //@ts-ignore
    mockNotification.onclick()

    expect(mockDispatch).toBeCalledWith({
      payload:
      {
        channel: "channelId",
        communityId: 1
      },
      type: "PublicChannels/setCurrentChannel"
    })
  }),

    test('do not display notification when the user is on a same channel and settings are set on show every notification', async () => {
      setupCrypto()
      const store = prepareStore().store
      const factory = await getFactory(store)

      const community1 = await factory.create<
        ReturnType<typeof communities.actions.addNewCommunity>['payload']
      >('Community')

      await factory.create<
        ReturnType<typeof identity.actions.addNewIdentity>['payload']
      >('Identity', { id: community1.id, nickname: 'alice' })

      const incomingMessagesChannelId = 'channelId'

      const incomingMessages = {
        messages: [{
          id: 'id',
          type: 1,
          message: 'message',
          createdAt: 1000000,
          channelId: incomingMessagesChannelId,
          signature: 'signature',
          pubKey: 'pubKey'
        }],
        communityId: community1.id
      }

      const publicChannel: PublicChannel = {
        name: 'general',
        description: 'description',
        owner: 'user',
        timestamp: 0,
        address: 'general'
      }

      const publicChannel2: PublicChannel = {
        name: incomingMessagesChannelId,
        description: 'description',
        owner: 'user',
        timestamp: 0,
        address: incomingMessagesChannelId
      }

      const communityChannels: CommunityChannels = {
        id: community1.id,
        currentChannel: incomingMessagesChannelId,
        channels: publicChannelsAdapter.setAll(
          publicChannelsAdapter.getInitialState(),
          [publicChannel, publicChannel2]
        ),
        channelMessages: channelMessagesAdapter.getInitialState(),
        channelLoadingSlice: 0
      }

      await expectSaga(
        displayMessageNotificationSaga,
        publicChannels.actions.incomingMessages(incomingMessages))
        .withReducer(
          combineReducers({
            [StoreKeys.Identity]: identity.reducer,
            [StoreKeys.Settings]: settings.reducer,
            [StoreKeys.PublicChannels]: publicChannels.reducer,
            [StoreKeys.Users]: users.reducer,
            [StoreKeys.Communities]: communities.reducer

          }),
          {
            [StoreKeys.Identity]: store.getState().Identity,
            [StoreKeys.Settings]: {
              ...new settings.State(),
              notificationsOption: NotificationsOptions.notifyForEveryMessage
            },
            [StoreKeys.PublicChannels]: {
              ...new publicChannels.State(),
              channels: communityChannelsAdapter.setAll(
                communityChannelsAdapter.getInitialState(),
                [communityChannels]
              )
            },
            [StoreKeys.Users]: { ...new users.State() },
            [StoreKeys.Communities]: store.getState().Communities
          }
        )
        .run()

      expect(notification).not.toHaveBeenCalled();
    }),

    test('do not display notification when the user is on a different channel and settings are set on do not show notifications', async () => {
      setupCrypto()
      const store = prepareStore().store
      const factory = await getFactory(store)

      const community1 = await factory.create<
        ReturnType<typeof communities.actions.addNewCommunity>['payload']
      >('Community')

      await factory.create<
        ReturnType<typeof identity.actions.addNewIdentity>['payload']
      >('Identity', { id: community1.id, nickname: 'alice' })

      const incomingMessagesChannelId = 'channelId'

      const incomingMessages = {
        messages: [{
          id: 'id',
          type: 1,
          message: 'message',
          createdAt: 1000000,
          channelId: incomingMessagesChannelId,
          signature: 'signature',
          pubKey: 'pubKey'
        }],
        communityId: community1.id
      }

      const publicChannel: PublicChannel = {
        name: 'general',
        description: 'description',
        owner: 'user',
        timestamp: 0,
        address: 'general'
      }

      const publicChannel2: PublicChannel = {
        name: incomingMessagesChannelId,
        description: 'description',
        owner: 'user',
        timestamp: 0,
        address: incomingMessagesChannelId
      }

      const communityChannels: CommunityChannels = {
        id: community1.id,
        currentChannel: publicChannel.address,
        channels: publicChannelsAdapter.setAll(
          publicChannelsAdapter.getInitialState(),
          [publicChannel, publicChannel2]
        ),
        channelMessages: channelMessagesAdapter.getInitialState(),
        channelLoadingSlice: 0
      }

      await expectSaga(
        displayMessageNotificationSaga,
        publicChannels.actions.incomingMessages(incomingMessages))
        .withReducer(
          combineReducers({
            [StoreKeys.Identity]: identity.reducer,
            [StoreKeys.Settings]: settings.reducer,
            [StoreKeys.PublicChannels]: publicChannels.reducer,
            [StoreKeys.Users]: users.reducer,
            [StoreKeys.Communities]: communities.reducer

          }),
          {
            [StoreKeys.Identity]: store.getState().Identity,
            [StoreKeys.Settings]: {
              ...new settings.State(),
              notificationsOption: NotificationsOptions.doNotNotifyOfAnyMessages
            },
            [StoreKeys.PublicChannels]: {
              ...new publicChannels.State(),
              channels: communityChannelsAdapter.setAll(
                communityChannelsAdapter.getInitialState(),
                [communityChannels]
              )
            },
            [StoreKeys.Users]: { ...new users.State() },
            [StoreKeys.Communities]: store.getState().Communities
          }
        )
        .run()
      expect(notification).not.toHaveBeenCalled();
    })

})