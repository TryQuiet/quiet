import { Platform, AppState, NativeModules } from 'react-native'
import { publicChannels, RICH_NOTIFICATION_CHANNEL } from '@quiet/state-manager'
import { PayloadAction } from '@reduxjs/toolkit'
import { call } from 'typed-redux-saga'

export function* showNotificationSaga(
  action: PayloadAction<ReturnType<typeof publicChannels.actions.markUnreadChannel>['payload']>
): Generator {
  const message = yield* call(JSON.stringify, action.payload.message)

  if (AppState.currentState === 'background') return
  if (Platform.OS === 'ios') return

  yield* call(NativeModules.NotificationModule.notify, RICH_NOTIFICATION_CHANNEL, message)
}
