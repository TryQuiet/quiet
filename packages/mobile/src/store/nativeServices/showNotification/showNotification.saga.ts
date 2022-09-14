import { Platform } from 'react-native'
import { publicChannels, RICH_NOTIFICATION_CHANNEL } from '@quiet/state-manager'
import { PayloadAction } from '@reduxjs/toolkit'
import { AppState, NativeModules } from 'react-native'
import { call } from 'typed-redux-saga'

export function* showNotificationSaga(
  action: PayloadAction<ReturnType<typeof publicChannels.actions.markUnreadChannel>['payload']>
): Generator {
  const payload = yield* call(JSON.stringify, {
    event: RICH_NOTIFICATION_CHANNEL,
    payload: [action.payload.message]
  })

  if (AppState.currentState === 'background') return
  if (Platform.OS === 'ios') return

  yield* call(NativeModules.NotificationModule.notify, '_EVENTS_', payload)
}
