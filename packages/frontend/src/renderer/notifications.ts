/* global Notification */
import { soundTypeToAudio } from '../shared/sounds'
import { PayloadAction } from '@reduxjs/toolkit'
import { Identity, identity, IncomingMessages, NotificationsOptions, NotificationsSounds, PublicChannel, publicChannels as channels, publicChannels, settings, User, users } from '@quiet/nectar'
import { all, call, select } from 'typed-redux-saga'
import store from './store'

export interface NotificationsData {
  title: string
  message: string
  sound: NotificationsSounds
  communityId: string
  channelName: string
}

interface createNotificationsCallsDataType {
  action: {
    payload: IncomingMessages;
    type: string;
  };
  publicChannels: PublicChannel[];
  usersData: {
    [pubKey: string]: User;
  };
  myIdentity: Identity;
  currentChannel: string;
  notificationsOption: NotificationsOptions;
  notificationsSound: NotificationsSounds;
}

export function* displayMessageNotificationSaga(
  action: PayloadAction<ReturnType<typeof channels.actions.incomingMessages>['payload']>
): Generator {
  const createNotificationsCallsData = {
    action,
    publicChannels: yield* select(channels.selectors.publicChannels),
    usersData: yield* select(users.selectors.certificatesMapping),
    myIdentity: yield* select(identity.selectors.currentIdentity),
    currentChannel: yield* select(channels.selectors.currentChannel),
    notificationsOption: yield* select(settings.selectors.getNotificationsOption),
    notificationsSound: yield* select(settings.selectors.getNotificationsSound),
  }

  const createNotificationsCalls = yield* call(messagesMapForNotificationsCalls, createNotificationsCallsData)
  yield* all(createNotificationsCalls)
}

const messagesMapForNotificationsCalls = (
  { action, currentChannel, myIdentity, notificationsOption,
    notificationsSound, publicChannels, usersData }: createNotificationsCallsDataType
) => {
  return action.payload.messages.map((messageData) => {
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
}

export const createNotificationSaga = (payload: NotificationsData): Notification => {
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
