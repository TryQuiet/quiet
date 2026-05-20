import { Platform, AppState, NativeModules } from 'react-native'
import Config from 'react-native-config'
import { users, publicChannels, PUSH_NOTIFICATION_CHANNEL } from '@quiet/state-manager'
import { PayloadAction } from '@reduxjs/toolkit'
import { call, select } from 'typed-redux-saga'
import { navigationSelectors } from '../../navigation/navigation.selectors'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { createLogger } from '../../../utils/logger'
import { MarkUnreadChannelPayload } from '@quiet/types'

const logger = createLogger('showNotification')

export function* showNotificationSaga(
  action: PayloadAction<ReturnType<typeof publicChannels.actions.markUnreadChannel>['payload']>
): Generator {
  const payload: MarkUnreadChannelPayload = action.payload
  if (Platform.OS === 'ios') return
  if (Config.FOREGROUND_PUSH_NOTIFICATIONS_ALLOWED === 'false') {
    logger.info('Foreground push notifications disabled by env flag')
    return
  }
  if (AppState.currentState === 'background') return

  const screen = yield* select(navigationSelectors.currentScreen)
  if (screen === ScreenNames.ChannelListScreen) return

  const _message = action.payload.message
  if (!_message) return

  const { channelId } = _message
  const channel = yield* select(publicChannels.selectors.getChannelById(channelId))
  if (!channel) {
    logger.warn(`No channel found for id ${channelId}`)
    return
  }
  const userProfile = yield* select(users.selectors.getUserProfileById(_message.userId))
  if (!userProfile) {
    logger.warn(`No user profile found for id ${_message.userId}`)
    return
  }
  const nickname = userProfile.nickname
  const messageWithChannelName = { ..._message, channelName: channel.name }

  const message = yield* call(JSON.stringify, messageWithChannelName)

  yield* call(NativeModules.CommunicationModule.handleIncomingEvents, PUSH_NOTIFICATION_CHANNEL, message, nickname)
}
