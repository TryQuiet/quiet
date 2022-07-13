import { combineReducers, Store } from '@reduxjs/toolkit'
import { prepareStore } from '../../testUtils/prepareStore'
import { reducers } from '../../store/reducers'
import { keyFromCertificate, parseCertificate, setupCrypto } from '@quiet/identity'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import {
  getFactory,
  connection,
  communities,
  Community,
  identity,
  Identity,
  messages,
  IncomingMessages,
  NotificationsOptions,
  NotificationsSounds,
  publicChannels,
  PublicChannel,
  settings,
  users
} from '@quiet/state-manager'
import { displayMessageNotificationSaga, isWindowFocused } from './notifications.saga'
import { soundTypeToAudio } from '../../../shared/sounds'

const originalNotification = window.Notification

const mockNotification = jest.fn()

const notification = jest.fn().mockImplementation(() => {
  return mockNotification
})

// @ts-expect-error
window.Notification = notification

const mockShow = jest.fn()

jest.mock('@electron/remote', () => {
  return {
    BrowserWindow: {
      getAllWindows: () => {
        return [
          {
            show: mockShow
          }
        ]
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

let store: Store

let community: Community
let alice: Identity
let publicChannel: PublicChannel

let incomingMessages: IncomingMessages

let userPubKey

const lastConnectedTime = 1000000

beforeAll(async () => {
  setupCrypto()

  store = (await prepareStore()).store

  const factory = await getFactory(store)

  community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
  >('Community')

  publicChannel = (
    await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>(
      'PublicChannel'
    )
  ).channel

  alice = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
    'Identity',
    { id: community.id, nickname: 'alice' }
  )

  const parsedCert = parseCertificate(alice.userCertificate)
  userPubKey = await keyFromCertificate(parsedCert)

  const senderPubKey = Object.keys(users.selectors.certificatesMapping(store.getState())).find(
    pubKey => pubKey !== userPubKey
  )

  store.dispatch(connection.actions.setLastConnectedTime(lastConnectedTime))

  incomingMessages = {
    messages: [
      {
        id: 'id',
        type: 1,
        message: 'message',
        createdAt: lastConnectedTime + 1,
        channelAddress: publicChannel.address,
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
  jest.resetAllMocks()

  // Reenable notification in settings
  store.dispatch(settings.actions.setNotificationsOption(NotificationsOptions.notifyForEveryMessage))

  // Reenable notification sound in settings
  store.dispatch(settings.actions.setNotificationsSound(NotificationsSounds.pow))

})

describe('displayNotificationsSaga', () => {
  test('display notification when the user is on a different channel and settings are set on show every notification', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessages)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .run()

    expect(notification).toBeCalledWith('New message from user_1 in #public-channel-1', {
      body: incomingMessages.messages[0].message,
      icon: '../../build/icon.png',
      silent: true
    })
  })

  test('clicking in notification foregrounds the app', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessages)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .run()

    // @ts-expect-error
    mockNotification.onclick()

    expect(mockShow).toHaveBeenCalled()
  })

  test('play a sound when the notification is displayed', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessages)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .run()

    expect(soundTypeToAudio.pow.play).toHaveBeenCalled()
  })

  test('do not display notification when the user is on a same channel', async () => {
    store.dispatch(
      publicChannels.actions.setCurrentChannel({ channelAddress: publicChannel.address })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessages)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('notification shows for message in current channel when app window does not have focus', async () => {
    store.dispatch(
      publicChannels.actions.setCurrentChannel({ channelAddress: publicChannel.address })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessages)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .run()

    expect(notification).toBeCalledWith('New message from user_1 in #public-channel-1', {
      body: incomingMessages.messages[0].message,
      icon: '../../build/icon.png',
      silent: true
    })
  })

  test('do not display notification when the message was sent before last connection app time', async () => {
    // Mock messages sent before last connection time
    const payload: IncomingMessages = {
      ...incomingMessages,
      messages: [
        {
          ...incomingMessages.messages[0],
          createdAt: lastConnectedTime - 1
        }
      ]
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(payload)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification when there is no sender info', async () => {
    // Mock messages missing the author
    const payload: IncomingMessages = {
      ...incomingMessages,
      messages: [
        {
          ...incomingMessages.messages[0],
          pubKey: 'notExistingPubKey'
        }
      ]
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(payload)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification when incoming message is from same user', async () => {
    const incomingMessagesWithUserPubKey: IncomingMessages = {
      ...incomingMessages,
      messages: [
        {
          ...incomingMessages.messages[0],
          pubKey: userPubKey
        }
      ]
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessagesWithUserPubKey)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not play a sound when the notification is displayed and sounds setting is set on do not play sound ', async () => {
    store.dispatch(settings.actions.setNotificationsSound(NotificationsSounds.none))

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessages)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .run()

    expect(soundTypeToAudio.pow.play).not.toHaveBeenCalled()
    expect(soundTypeToAudio.bang.play).not.toHaveBeenCalled()
    expect(soundTypeToAudio.splat.play).not.toHaveBeenCalled()
  })

  test('do not display notification when settings are set on do not show notifications', async () => {
    store.dispatch(settings.actions.setNotificationsOption(NotificationsOptions.doNotNotifyOfAnyMessages))

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages(incomingMessages)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .run()

    expect(notification).not.toHaveBeenCalled()
  })
})
