import { combineReducers, Store } from '@reduxjs/toolkit'
import { prepareStore } from '../../testUtils/prepareStore'
import { reducers } from '../../store/reducers'
import { setupCrypto } from '@quiet/identity'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import {
  getFactory,
  connection,
  communities,
  identity,
  messages,
  NotificationsOptions,
  NotificationsSounds,
  publicChannels,
  settings,
} from '@quiet/state-manager'
import { Community, Identity, ChannelMessage, IncomingMessages, PublicChannel, MessageType } from '@quiet/types'
import { createNotification, displayMessageNotificationSaga, isWindowFocused } from './notifications.saga'
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
            show: mockShow,
          },
        ]
      },
    },
  }
})

jest.mock('../../../shared/sounds', () => ({
  ...jest.requireActual('../../../shared/sounds'),
  soundTypeToAudio: {
    librarianShhh: {
      play: jest.fn(),
    },
    pow: {
      play: jest.fn(),
    },
    bang: {
      play: jest.fn(),
    },
    splat: {
      play: jest.fn(),
    },
  },
}))

let store: Store

let community: Community

let alice: Identity
let bob: Identity

let sailingChannel: PublicChannel

let aliceMessage: ChannelMessage
let message: ChannelMessage

const lastConnectedTime = 1000000

beforeAll(async () => {
  setupCrypto()

  store = (await prepareStore()).store

  const factory = await getFactory(store)

  community = await factory.create<ReturnType<typeof communities.actions.storeCommunity>['payload']>('Community')
  const generalChannel = publicChannels.selectors.generalChannel(store.getState())
  expect(generalChannel).not.toBeUndefined()
  store.dispatch(
    publicChannels.actions.setCurrentChannel({
      // @ts-expect-error
      channelId: generalChannel.id,
    })
  )
  sailingChannel = (
    await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>('PublicChannel')
  ).channel

  alice = await factory.create<ReturnType<typeof identity.actions.storeIdentity>['payload']>('Identity', {
    id: community.id,
    nickname: 'alice',
  })

  store.dispatch(connection.actions.setLastConnectedTime(lastConnectedTime))

  bob = (
    await factory.build<typeof identity.actions.storeIdentity>('Identity', {
      id: community.id,
      nickname: 'bob',
    })
  ).payload

  message = (
    await factory.build<typeof publicChannels.actions.test_message>('Message', {
      identity: bob,
      message: {
        id: Math.random().toString(36).substr(2.9),
        type: MessageType.Basic,
        message: 'hello there!',
        createdAt: lastConnectedTime + 1,
        channelId: sailingChannel.id,
        signature: '',
        pubKey: '',
      },
    })
  ).payload.message

  aliceMessage = (
    await factory.build<typeof publicChannels.actions.test_message>('Message', {
      identity: alice,
      message: {
        id: Math.random().toString(36).substr(2.9),
        type: MessageType.Basic,
        message: 'how are you?',
        createdAt: lastConnectedTime + 1,
        channelId: sailingChannel.id,
        signature: '',
        pubKey: '',
      },
    })
  ).payload.message
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
  store.dispatch(settings.actions.setNotificationsSound(NotificationsSounds.librarianShhh))
})

describe('displayNotificationsSaga', () => {
  test('display notification', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .call(createNotification, {
        label: `New message from @${bob.nickname} in #${sailingChannel.name}`,
        body: message.message,
        channel: sailingChannel.id,
        sound: NotificationsSounds.pow,
      })
      .run()

    expect(notification).toBeCalledWith(`New message from @${bob.nickname} in #${sailingChannel.name}`, {
      body: message.message,
      icon: '../../build/icon.png',
      silent: true,
    })
  })

  test('do not display notification if message is not verified', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: false,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('clicking in notification foregrounds the app', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .not.call(createNotification)
      .run()

    // @ts-expect-error
    mockNotification.onclick()

    expect(mockShow).toHaveBeenCalled()
  })

  test('play a sound when the notification is displayed', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .run()

    expect(soundTypeToAudio.librarianShhh.play).toHaveBeenCalled()
  })

  test('do not display notification when the user is on the active channel', async () => {
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: sailingChannel.id }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('notification shows for message in current channel when app window does not have focus', async () => {
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: sailingChannel.id }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .call(createNotification, {
        label: `New message from @${bob.nickname} in #${sailingChannel.name}`,
        body: message.message,
        channel: sailingChannel.id,
        sound: NotificationsSounds.librarianShhh,
      })
      .run()

    expect(notification).toBeCalledWith(`New message from @${bob.nickname} in #${sailingChannel.name}`, {
      body: message.message,
      icon: '../../build/icon.png',
      silent: true,
    })
  })

  test('notification shows for message in non-active channel when app window has focus', async () => {
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: 'general' }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .call(createNotification, {
        label: `New message from @${bob.nickname} in #${sailingChannel.name}`,
        body: message.message,
        channel: sailingChannel.id,
        sound: NotificationsSounds.librarianShhh,
      })
      .run()

    expect(notification).toBeCalledWith(`New message from @${bob.nickname} in #${sailingChannel.name}`, {
      body: message.message,
      icon: '../../build/icon.png',
      silent: true,
    })
  })

  test('do not display notification when the message was sent before last connection app time', async () => {
    // Mock messages sent before last connection time
    const payload: IncomingMessages = {
      messages: [
        {
          ...message,
          createdAt: lastConnectedTime - 1,
        },
      ],
      isVerified: true,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification when there is no sender info', async () => {
    // Mock messages missing the author
    const payload: IncomingMessages = {
      messages: [
        {
          ...message,
          pubKey: 'fake',
        },
      ],
      isVerified: true,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification for own messages', async () => {
    const payload: IncomingMessages = {
      messages: [aliceMessage],
      isVerified: true,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not play sounds if turned off in settings', async () => {
    store.dispatch(settings.actions.setNotificationsSound(NotificationsSounds.none))

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .call(createNotification, {
        label: `New message from @${bob.nickname} in #${sailingChannel.name}`,
        body: message.message,
        channel: sailingChannel.id,
        sound: NotificationsSounds.none,
      })
      .run()

    expect(soundTypeToAudio.librarianShhh.play).not.toHaveBeenCalled()
    expect(soundTypeToAudio.pow.play).not.toHaveBeenCalled()
    expect(soundTypeToAudio.bang.play).not.toHaveBeenCalled()
    expect(soundTypeToAudio.splat.play).not.toHaveBeenCalled()
  })

  test('do not display notifications if turned off in settings', async () => {
    store.dispatch(settings.actions.setNotificationsOption(NotificationsOptions.doNotNotifyOfAnyMessages))

    const reducer = combineReducers(reducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.incomingMessages({
        messages: [message],
        isVerified: true,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('display notification for incoming image', async () => {
    const payload: IncomingMessages = {
      messages: [
        {
          ...message,
          type: MessageType.Image,
          media: {
            cid: 'cid',
            path: null,
            name: 'image',
            ext: '.png',
            message: {
              id: message.id,
              channelId: message.channelId,
            },
          },
        },
      ],
      isVerified: true,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .call(createNotification, {
        label: `@${bob.nickname} sent an image in #${sailingChannel.name}`,
        body: undefined,
        channel: sailingChannel.id,
        sound: NotificationsSounds.librarianShhh,
      })
      .run()

    expect(notification).toBeCalledWith(`@${bob.nickname} sent an image in #${sailingChannel.name}`, {
      body: undefined,
      icon: '../../build/icon.png',
      silent: true,
    })
  })

  test('display notification for incoming file', async () => {
    const payload: IncomingMessages = {
      messages: [
        {
          ...message,
          type: MessageType.File,
          media: {
            cid: 'cid',
            path: null,
            name: 'file',
            ext: '.ext',
            message: {
              id: message.id,
              channelId: message.channelId,
            },
          },
        },
      ],
      isVerified: true,
    }

    const reducer = combineReducers(reducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.incomingMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .call(createNotification, {
        label: `@${bob.nickname} sends file in #${sailingChannel.name}`,
        body: undefined,
        channel: sailingChannel.id,
        sound: NotificationsSounds.librarianShhh,
      })
      .run()

    expect(notification).toBeCalledWith(`@${bob.nickname} sends file in #${sailingChannel.name}`, {
      body: undefined,
      icon: '../../build/icon.png',
      silent: true,
    })
  })
})
