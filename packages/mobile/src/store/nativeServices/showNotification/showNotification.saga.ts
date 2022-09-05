import { identity, messages, RICH_NOTIFICATION_CHANNEL, users } from '@quiet/state-manager'
import { PayloadAction } from '@reduxjs/toolkit'
import { NativeModules } from 'react-native'
import { call, select } from 'typed-redux-saga'

export function* showNotificationSaga(
  action: PayloadAction<ReturnType<typeof messages.actions.incomingMessages>['payload']>
): Generator {
  const message = action.payload.messages[0]
  const stringChannelMessage = yield* call(JSON.stringify, message)

  // own message
  const certificatesMapping = yield* select(users.selectors.certificatesMapping)
  const currentIdentity = yield* select(identity.selectors.currentIdentity)

  const sender = certificatesMapping[message.pubKey]?.username
  if (!sender || sender === currentIdentity.nickname) return

  yield* call(NativeModules.NotificationModule.notify, RICH_NOTIFICATION_CHANNEL, stringChannelMessage)
}
