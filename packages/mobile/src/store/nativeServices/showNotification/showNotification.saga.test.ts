import { expectSaga } from 'redux-saga-test-plan'
import { showNotificationSaga } from './showNotification.saga'
import { MarkUnreadChannelPayload, publicChannels, RICH_NOTIFICATION_CHANNEL } from '@quiet/state-manager'
import { call } from 'redux-saga-test-plan/matchers'
import { NativeModules } from 'react-native'

describe('showNotificationSaga', () => {
  test('show notification for new messages', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'active'
    }))

    NativeModules.NotificationModule = {
      notify: jest.fn()
    }

    const unreadMessage: MarkUnreadChannelPayload = {
      channelAddress: 'channelAddress',
      message: {
        channelAddress: 'address',
        createdAt: 0,
        id: 'id',
        message: 'message',
        pubKey: 'pubKey',
        signature: 'signature',
        type: 1
      }
    }
    const payload = JSON.stringify({
      event: RICH_NOTIFICATION_CHANNEL,
      payload: [
        unreadMessage
      ]
    })

    await expectSaga(
      showNotificationSaga,
      publicChannels.actions.markUnreadChannel(unreadMessage)
      )
      .provide([
        [call.fn(JSON.stringify), payload],
        [call.fn(NativeModules.NotificationModule.notify), null]
      ])
      .call(NativeModules.NotificationModule.notify, '_EVENTS_', payload)
      .run()
  })

  test('do not show notifications when the app is in background', async () => {
    jest.mock('react-native/Libraries/AppState/AppState', () => ({
      currentState: 'background'
    }))

    NativeModules.NotificationModule = {
      notify: jest.fn()
    }

    const unreadMessage: MarkUnreadChannelPayload = {
      channelAddress: 'channelAddress',
      message: {
        channelAddress: 'address',
        createdAt: 0,
        id: 'id',
        message: 'message',
        pubKey: 'pubKey',
        signature: 'signature',
        type: 1
      }
    }
    const payload = JSON.stringify({
      event: RICH_NOTIFICATION_CHANNEL,
      payload: [
        unreadMessage
      ]
    })

    await expectSaga(
      showNotificationSaga,
      publicChannels.actions.markUnreadChannel(unreadMessage)
      )
      .provide([
        [call.fn(JSON.stringify), payload],
        [call.fn(NativeModules.NotificationModule.notify), null]
      ])
      .not.call(NativeModules.NotificationModule.notify)
      .run()
  })
})
