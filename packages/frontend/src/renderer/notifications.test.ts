import { displayMessageNotificationSaga } from './notifications'
import { expectSaga } from 'redux-saga-test-plan'
import { unreadMessagesAdapter, certificatesAdapter, channelMessagesAdapter, communities, CommunityChannels, communityChannelsAdapter, getFactory, identity, IncomingMessages, NotificationsOptions, NotificationsSounds, prepareStore, PublicChannel, publicChannels, publicChannelsAdapter, settings, StoreKeys, users } from '@quiet/nectar'
import { combineReducers } from '@reduxjs/toolkit'
import { keyFromCertificate, parseCertificate, setupCrypto } from '@quiet/identity'

const originalNotification = window.Notification
const mockNotification = jest.fn()
const mockDispatch = jest.fn()

const notification = jest.fn().mockImplementation(() => { return mockNotification })

jest.mock('./store/create', () => { return () => ({ dispatch: mockDispatch }) })

const mockShow = jest.fn()
const mockIsFocused = jest.fn()

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

// @ts-expect-error
window.Notification = notification

let incomingMessages: IncomingMessages
let storeReducersWithDifferentCurrentChannel
let communityChannels: CommunityChannels
let userPubKey: string
const incomingMessagesChannelId = 'channelId'

beforeAll(async () => {
  setupCrypto()
  const store = prepareStore().store
  const factory = await getFactory(store)

  const community1 = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
  >('Community')

  const userIdentity = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
  >('Identity', { id: community1.id, nickname: 'alice' })

  incomingMessages = {
    messages: [{
      id: 'id',
      type: 1,
      message: 'message',
      createdAt: 1000000,
      channelAddress: incomingMessagesChannelId,
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

  communityChannels = {
    id: community1.id,
    currentChannel: publicChannel.address,
    channels: publicChannelsAdapter.setAll(
      publicChannelsAdapter.getInitialState(),
      [publicChannel, publicChannel2]
    ),
    channelMessages: channelMessagesAdapter.getInitialState(),
    channelLoadingSlice: 0,
    unreadMessages: unreadMessagesAdapter.getInitialState()
  }

  const userCertString = userIdentity.userCertificate

  const parsedCert = parseCertificate(userCertString)
  userPubKey = keyFromCertificate(parsedCert)

  storeReducersWithDifferentCurrentChannel = {
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
    [StoreKeys.Users]: {
      ...new users.State(),
      certificates: certificatesAdapter.setAll(
        certificatesAdapter.getInitialState(),
        [parsedCert]
      )
    },
    [StoreKeys.Communities]: store.getState().Communities
  }
})

afterAll(() => {
  window.Notification = originalNotification
})

afterEach(() => {
  notification.mockClear()
  mockShow.mockClear()
  mockIsFocused.mockClear()
})

describe('displayNotificationsSaga', () => {
  test('display notification when the user is on a different channel and settings are set on show every notification', async () => {
    mockIsFocused.mockImplementationOnce(() => { return true })

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
        storeReducersWithDifferentCurrentChannel
      )
      .run()

    expect(notification).toBeCalledWith(
      `New message in ${incomingMessagesChannelId}`,
      { body: incomingMessages.messages[0].message }
    )
  })

  test('do not display notification when the user is on a same channel', async () => {
    mockIsFocused.mockImplementationOnce(() => { return true })

    const storeReducersWithCurrentChannelFromMessage = {
      ...storeReducersWithDifferentCurrentChannel,
      [StoreKeys.PublicChannels]: {
        ...new publicChannels.State(),
        channels: communityChannelsAdapter.setAll(
          communityChannelsAdapter.getInitialState(),
          [{
            ...communityChannels,
            currentChannel: incomingMessagesChannelId
          }]
        )
      }
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
        storeReducersWithCurrentChannelFromMessage
      )
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification when incoming message is from same user', async () => {
    mockIsFocused.mockImplementationOnce(() => { return true })

    const incomingMessagesWithUserPubKey: IncomingMessages = {
      ...incomingMessages,
      messages: [{
        ...incomingMessages.messages[0],
        pubKey: userPubKey
      }]
    }

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessagesWithUserPubKey))
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer

        }),
        storeReducersWithDifferentCurrentChannel
      )
      .run()
    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification when settings are set on do not show notifications', async () => {
    mockIsFocused.mockImplementationOnce(() => { return true })

    const storeReducersWithDoNotShowNotificationsSetting = {
      ...storeReducersWithDifferentCurrentChannel,
      [StoreKeys.Settings]: {
        ...new settings.State(),
        notificationsOption: NotificationsOptions.doNotNotifyOfAnyMessages
      }
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
        storeReducersWithDoNotShowNotificationsSetting
      )
      .run()
    expect(notification).not.toHaveBeenCalled()
  })

  test('clicking in notification takes you to message in relevant channel, and foregrounds the app', async () => {
    mockIsFocused.mockImplementationOnce(() => { return false })

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
        storeReducersWithDifferentCurrentChannel
      )
      .run()

    // simulate click on notification
    // @ts-expect-error
    mockNotification.onclick()

    expect(mockDispatch).toBeCalledWith({
      payload:
      {
        channelAddress: 'channelId',
        communityId: 1
      },
      type: 'PublicChannels/setCurrentChannel'
    })

    expect(mockShow).toHaveBeenCalled()
  })

  test('notification shows for message in current channel when app window does not have focus', async () => {
    mockIsFocused.mockImplementationOnce(() => { return false })

    const storeReducersWithCurrentChannelFromMessage = {
      ...storeReducersWithDifferentCurrentChannel,
      [StoreKeys.PublicChannels]: {
        ...new publicChannels.State(),
        channels: communityChannelsAdapter.setAll(
          communityChannelsAdapter.getInitialState(),
          [{
            ...communityChannels,
            currentChannel: incomingMessagesChannelId
          }]
        )
      }
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
        storeReducersWithCurrentChannelFromMessage
      )
      .run()

    expect(notification).toBeCalledWith(
      `New message in ${incomingMessagesChannelId}`,
      { body: incomingMessages.messages[0].message }
    )
  })
})
