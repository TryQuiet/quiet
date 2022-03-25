import { displayMessageNotificationSaga } from './notifications'
import { expectSaga } from 'redux-saga-test-plan'
import {
  communities,
  identity,
  users,
  connection,
  getFactory,
  IncomingMessages,
  NotificationsOptions,
  NotificationsSounds,
  prepareStore,
  publicChannels,
  settings,
  StoreKeys,
  Identity,
  Community,
  PublicChannel
} from '@quiet/nectar'
import { combineReducers } from '@reduxjs/toolkit'
import { keyFromCertificate, parseCertificate, setupCrypto } from '@quiet/identity'
import { soundTypeToAudio } from '../../../shared/sounds'

const originalNotification = window.Notification
const mockNotification = jest.fn()
const notification = jest.fn().mockImplementation(() => {
  return mockNotification
})
// @ts-expect-error
window.Notification = notification

const mockShow = jest.fn()
const mockIsFocused = jest.fn()

jest.mock('electron', () => {
  return {
    remote: {
      BrowserWindow: {
        getAllWindows: () => {
          return [
            {
              show: mockShow,
              isFocused: mockIsFocused
            }
          ]
        }
      }
    }
  }
})

jest.mock('../../../shared/sounds', () => ({
  // @ts-expect-error
  ...jest.requireActual('../../../shared/sounds'),
  soundTypeToAudio: {
    pow: {
      play: jest.fn()
    },
    bang: {
      play: jest.fn()
    },
    splat: {
      play: jest.fn()
    }
  }
}))

let store

let incomingMessages: IncomingMessages

let channel: PublicChannel
let community: Community
let user: Identity
let userPubKey: string
let sender: Identity
let senderPubKey: string

const lastConnectedTime = 1000000

beforeAll(async () => {
  setupCrypto()

  store = await prepareStore().store

  const factory = await getFactory(store)

  community = await factory.create<
  ReturnType<typeof communities.actions.addNewCommunity>['payload']
  >('Community')

  channel = (await factory.create<
  ReturnType<typeof publicChannels.actions.addChannel>['payload']
  >('PublicChannel', { communityId: community.id })).channel

  user = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
    'Identity',
    { id: community.id }
  )

  await factory.create<ReturnType<typeof users.actions.storeUserCertificate>['payload']>(
    'UserCertificate',
    {
      certificate: user.userCertificate
    }
  )

  userPubKey = await keyFromCertificate(parseCertificate(user.userCertificate))

  sender = (await factory.build<typeof identity.actions.addNewIdentity>(
    'Identity',
    { id: community.id }
  )).payload

  await factory.create<ReturnType<typeof users.actions.storeUserCertificate>['payload']>(
    'UserCertificate',
    {
      certificate: sender.userCertificate
    }
  )

  senderPubKey = await keyFromCertificate(parseCertificate(sender.userCertificate))

  store.dispatch(connection.actions.setLastConnectedTime(lastConnectedTime))

  incomingMessages = {
    communityId: community.id,
    messages: [
      {
        id: 'id',
        type: 1,
        message: 'message',
        createdAt: lastConnectedTime + 1,
        channelAddress: channel.address,
        signature: 'signature',
        pubKey: senderPubKey
      }
    ]
  }
})

afterAll(() => {
  window.Notification = originalNotification
})

afterEach(() => {
  notification.mockClear()
  mockShow.mockClear()
  mockIsFocused.mockClear()
  jest.resetAllMocks()
})

describe('displayNotificationsSaga', () => {
  test('display notification when the user is on a different channel and settings are set on show every notification', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return true
    })

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        store.getState()
      )
      .run()

    expect(notification).toBeCalledWith(`New message from ${sender.nickname} in #public-channel-1`, {
      body: incomingMessages.messages[0].message,
      icon: '../../build/icon.png',
      silent: true
    })
  })

  test('do not display notification when incoming message is from same user', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return true
    })

    const incomingMessagesWithUserPubKey: IncomingMessages = {
      ...incomingMessages,
      messages: [
        {
          ...incomingMessages.messages[0],
          pubKey: userPubKey
        }
      ]
    }

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessagesWithUserPubKey)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        store.getState()
      )
      .run()
    expect(notification).not.toHaveBeenCalled()
  })

  test('clicking in notification foregrounds the app', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return false
    })

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        store.getState()
      )
      .run()

    // simulate click on notification
    // @ts-expect-error
    mockNotification.onclick()

    expect(mockShow).toHaveBeenCalled()
  })

  test('play a sound when the notification is displayed', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return true
    })

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        store.getState()
      )
      .run()
    expect(soundTypeToAudio.pow.play).toHaveBeenCalled()
  })

  test('do not play a sound when the notification is displayed and sounds setting is set on do not play sound ', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return true
    })

    const storeWithNotificationsSoundTurnedOff = {
      ...store.getState(),
      [StoreKeys.Settings]: {
        ...new settings.State(),
        notificationsSound: NotificationsSounds.none
      }
    }

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        storeWithNotificationsSoundTurnedOff
      )
      .run()

    expect(soundTypeToAudio.pow.play).not.toHaveBeenCalled()
    expect(soundTypeToAudio.bang.play).not.toHaveBeenCalled()
    expect(soundTypeToAudio.splat.play).not.toHaveBeenCalled()
  })

  test('do not display notification when settings are set on do not show notifications', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return true
    })

    const storeReducersWithDoNotShowNotificationsSetting = {
      ...store.getState(),
      [StoreKeys.Settings]: {
        ...new settings.State(),
        notificationsOption: NotificationsOptions.doNotNotifyOfAnyMessages
      }
    }

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages)
    )
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

  test('do not display notification when the user is on a same channel', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return true
    })

    const storeReducersWithCurrentChannelFromMessage = {
      ...store
    }

    storeReducersWithCurrentChannelFromMessage.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelAddress: channel.address,
        communityId: community.id
      })
    )

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        storeReducersWithCurrentChannelFromMessage.getState()
      )
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('notification shows for message in current channel when app window does not have focus', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return false
    })

    const storeReducersWithCurrentChannelFromMessage = store
    storeReducersWithCurrentChannelFromMessage.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelAddress: channel.address,
        communityId: community.id
      })
    )

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessages)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        storeReducersWithCurrentChannelFromMessage.getState()
      )
      .run()

    expect(notification).toBeCalledWith(`New message from ${sender.nickname} in #public-channel-1`, {
      body: incomingMessages.messages[0].message,
      icon: '../../build/icon.png',
      silent: true
    })
  })

  test('do not display notification when the message was sent before last connection app time', async () => {
    mockIsFocused.mockImplementationOnce(() => {
      return true
    })

    const incomingMessagesWithTimeStampBeforeLastConnectedTime: IncomingMessages = {
      ...incomingMessages,
      messages: [
        {
          ...incomingMessages.messages[0],
          createdAt: lastConnectedTime - 1
        }
      ]
    }

    await expectSaga(
      displayMessageNotificationSaga,
      publicChannels.actions.incomingMessages(incomingMessagesWithTimeStampBeforeLastConnectedTime)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identity.reducer,
          [StoreKeys.Settings]: settings.reducer,
          [StoreKeys.PublicChannels]: publicChannels.reducer,
          [StoreKeys.Users]: users.reducer,
          [StoreKeys.Communities]: communities.reducer
        }),
        store.getState()
      )
      .run()

    expect(notification).not.toHaveBeenCalled()
  })
})
