import { Platform, AppState, NativeModules } from 'react-native'
import { users, publicChannels, PUSH_NOTIFICATION_CHANNEL } from '@quiet/state-manager'
import { PayloadAction } from '@reduxjs/toolkit'
import { call, select } from 'typed-redux-saga'
import { navigationSelectors } from '../../navigation/navigation.selectors'
import { ScreenNames } from '../../../const/ScreenNames.enum'

export function* showNotificationSaga(
  action: PayloadAction<ReturnType<typeof publicChannels.actions.markUnreadChannel>['payload']>
): Generator {
  if (Platform.OS === 'ios') return
  if (AppState.currentState === 'background') return

  const screen = yield* select(navigationSelectors.currentScreen)
  if (screen === ScreenNames.ChannelListScreen) return

  const _message = action.payload.message
  if (!_message) return

  const message = yield* call(JSON.stringify, _message)

  const mapping = yield* select(users.selectors.certificatesMapping)
  const username = mapping[_message.pubKey].username

  yield* call(NativeModules.CommunicationModule.handleIncomingEvents, PUSH_NOTIFICATION_CHANNEL, message, username)
}
