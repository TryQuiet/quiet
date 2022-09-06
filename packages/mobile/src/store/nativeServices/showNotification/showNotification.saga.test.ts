import { expectSaga } from 'redux-saga-test-plan'
import { showNotificationSaga } from './showNotification.saga'
import { MarkUnreadChannelPayload, publicChannels, RICH_NOTIFICATION_CHANNEL } from '@quiet/state-manager'
import { call } from 'redux-saga-test-plan/matchers'
import { NativeModules } from 'react-native'

describe('showNotificationSaga', () => {
  test('show notification for new messages', async () => {
    NativeModules.NotificationModule = {
      notify: jest.fn()
    }

    const unreadMessage: MarkUnreadChannelPayload = {
      channelAddress: 'channelAddress',
      message: {
        channelAddress: 'address',
        createdAt: 1000000,
        id: 'id',
        message: 'message',
        pubKey: 'pubKey',
        signature: 'signature',
        type: 1
      }
    }
    const mockJSONMessage = 'messageJsonObject'

    await expectSaga(
      showNotificationSaga,
      publicChannels.actions.markUnreadChannel(unreadMessage)
      )
      .provide([
        [call.fn(JSON.stringify), mockJSONMessage],
        [call.fn(NativeModules.NotificationModule.notify), null]
      ])
      .call(JSON.stringify, unreadMessage.message)
      .call(NativeModules.NotificationModule.notify, RICH_NOTIFICATION_CHANNEL, mockJSONMessage)
      .run()
  })
})
