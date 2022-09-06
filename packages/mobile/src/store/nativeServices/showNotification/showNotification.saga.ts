import { publicChannels, RICH_NOTIFICATION_CHANNEL } from '@quiet/state-manager'
import { PayloadAction } from '@reduxjs/toolkit'
import { NativeModules } from 'react-native'
import { call } from 'typed-redux-saga'

export function* showNotificationSaga(
  action: PayloadAction<ReturnType<typeof publicChannels.actions.markUnreadChannel>['payload']>
): Generator {
  const stringChannelMessage = yield* call(JSON.stringify, action.payload.message)

  yield* call(NativeModules.NotificationModule.notify, RICH_NOTIFICATION_CHANNEL, stringChannelMessage)
}
