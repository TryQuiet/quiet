import { combineReducers, Store } from '@reduxjs/toolkit'
import { prepareStore, testReducers } from '../../testUtils/prepareStore'
import { setupCrypto } from '@quiet/identity'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import {
  getReduxStoreFactory,
  connection,
  messages,
  NotificationsOptions,
  NotificationsSounds,
  publicChannels,
  settings,
} from '@quiet/state-manager'
import {
  Community,
  Identity,
  ChannelMessage,
  MessagesLoadedPayload,
  PublicChannel,
  MessageType,
  UserProfile,
} from '@quiet/types'
import { createNotification, displayMessageNotificationSaga, isWindowFocused } from './notifications.saga'
import { soundTypeToAudio } from '../../../shared/sounds'
import { createLogger } from '../../logger'

const logger = createLogger('notifications.test')

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
let bob: UserProfile

let sailingChannel: PublicChannel

let aliceMessage: ChannelMessage
let message: ChannelMessage

const lastConnectedTime = 1000000

beforeAll(async () => {
  setupCrypto()

  store = (await prepareStore()).store

  const factory = await getReduxStoreFactory(store)

  community = await factory.create('Community')
  const generalChannel = publicChannels.selectors.generalChannel(store.getState())
  expect(generalChannel).not.toBeUndefined()
  store.dispatch(
    publicChannels.actions.setCurrentChannel({
      // @ts-expect-error
      channelId: generalChannel.id,
    })
  )
  sailingChannel = (await factory.create('PublicChannel')).channel

  alice = await factory.create('Identity', {
    communityId: community.id,
  })

  store.dispatch(connection.actions.setLastConnectedTime(lastConnectedTime))

  bob = await factory.create('UserProfile', { nickname: 'bob' })

  message = (
    await factory.build('TestMessage', {
      message: {
        id: Math.random().toString(36).substr(2.9),
        type: MessageType.Basic,
        message: 'hello there!',
        createdAt: lastConnectedTime + 1,
        channelId: sailingChannel.id,
        userId: bob.userId,
      },
    })
  ).payload.message

  aliceMessage = (
    await factory.build('TestMessage', {
      message: {
        id: Math.random().toString(36).substr(2.9),
        type: MessageType.Basic,
        message: 'how are you?',
        createdAt: lastConnectedTime + 1,
        channelId: sailingChannel.id,
        userId: alice.userId,
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
    logger.info('display notification')
    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('do not display notification if message is not verified')
    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('clicking in notification foregrounds the app')
    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('play a sound when the notification is displayed')
    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('do not display notification when the user is on the active channel')
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: sailingChannel.id }))

    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('notification shows for message in current channel when app window does not have focus')
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: sailingChannel.id }))

    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('notification shows for message in non-active channel when app window has focus')
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: 'general' }))

    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('do not display notification when the message was sent before last connection app time')
    // Mock messages sent before last connection time
    const payload: MessagesLoadedPayload = {
      messages: [
        {
          ...message,
          createdAt: lastConnectedTime - 1,
        },
      ],
      isVerified: true,
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.addMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification when there is no sender info', async () => {
    logger.info('do not display notification when there is no sender info')
    // Mock messages missing the author
    const payload: MessagesLoadedPayload = {
      messages: [
        {
          ...message,
          userId: 'fake',
        },
      ],
      isVerified: true,
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.addMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), true]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not display notification for own messages', async () => {
    logger.info('do not display notification for own messages')
    const payload: MessagesLoadedPayload = {
      messages: [aliceMessage],
      isVerified: true,
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.addMessages(payload))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(isWindowFocused), false]])
      .not.call(createNotification)
      .run()

    expect(notification).not.toHaveBeenCalled()
  })

  test('do not play sounds if turned off in settings', async () => {
    logger.info('do not play sounds if turned off in settings')
    store.dispatch(settings.actions.setNotificationsSound(NotificationsSounds.none))

    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('do not display notifications if turned off in settings')
    store.dispatch(settings.actions.setNotificationsOption(NotificationsOptions.doNotNotifyOfAnyMessages))

    const reducer = combineReducers(testReducers)
    await expectSaga(
      displayMessageNotificationSaga,
      messages.actions.addMessages({
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
    logger.info('display notification for incoming image')
    const payload: MessagesLoadedPayload = {
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

    const reducer = combineReducers(testReducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.addMessages(payload))
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
    logger.info('display notification for incoming file')
    const payload: MessagesLoadedPayload = {
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

    const reducer = combineReducers(testReducers)
    await expectSaga(displayMessageNotificationSaga, messages.actions.addMessages(payload))
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
