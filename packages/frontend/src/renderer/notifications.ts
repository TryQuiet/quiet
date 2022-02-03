/* global Notification */
import { soundTypeToAudio } from '../shared/sounds'
import { PayloadAction } from '@reduxjs/toolkit'
import { identity, NotificationsOptions, NotificationsSounds, publicChannels as channels, publicChannels, settings, users } from '@quiet/nectar'
import { all, call, select } from 'typed-redux-saga'
import store from './store'

export interface NotificationsData {
  title: string
  message: string
  sound: NotificationsSounds
  communityId: string
  channelName: string
}

export function* displayMessageNotificationSaga(
  action: PayloadAction<ReturnType<typeof channels.actions.incomingMessages>['payload']>
): Generator {
  const publicChannels = yield* select(channels.selectors.publicChannels)
  const usersData = yield* select(users.selectors.certificatesMapping)
  const myIdentity = yield* select(identity.selectors.currentIdentity)
  const currentChannel = yield* select(channels.selectors.currentChannel)
  const notificationsOption = yield* select(settings.selectors.getNotificationsOption)
  const notificationsSound = yield* select(settings.selectors.getNotificationsSound)

  const createNotificationsCalls = action.payload.messages.map((messageData) => {
    const publicChannelFromMessage = publicChannels.find((channel) => channel.address === messageData.channelId)

    const isMessageFromMyUser = usersData[messageData.pubKey]?.username === myIdentity.nickname
    const isMessageFromCurrentChannel = currentChannel === publicChannelFromMessage.name
    const isNotificationsOptionOff = NotificationsOptions.doNotNotifyOfAnyMessages === notificationsOption

    if (!isMessageFromMyUser && !isMessageFromCurrentChannel && !isNotificationsOptionOff) {
      return call(createNotificationSaga, {
        title: `New message in ${publicChannelFromMessage.name || 'Unnamed'}`,
        message: `${messageData.message.substring(0, 64)}${messageData.message.length > 64 ? '...' : ''}`,
        sound: notificationsSound,
        communityId: action.payload.communityId,
        channelName: publicChannelFromMessage.name
      })
    }
  })
  yield* all(createNotificationsCalls)
}

export function* createNotificationSaga(payload: NotificationsData): Generator {
  if (soundTypeToAudio[payload.sound]) {
    soundTypeToAudio[payload.sound].play()
  }
  const notification = new Notification(payload.title, { body: payload.message })
  notification.onclick = () => {
    store.dispatch(publicChannels.actions.setCurrentChannel({
      channel: payload.channelName,
      communityId: payload.communityId
    }))
  }

  return notification
}

export default {
  createNotificationSaga
}
