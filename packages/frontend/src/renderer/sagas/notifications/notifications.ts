/* global Notification */
import { PayloadAction } from '@reduxjs/toolkit'
import { connection, Identity, identity, IncomingMessages, NotificationsOptions, NotificationsSounds, PublicChannel, publicChannels as channels, settings, User, users } from '@quiet/nectar'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { app } from 'electron'
import remote from '@electron/remote'
import { soundTypeToAudio } from '../../../shared/sounds'
import { eventChannel, END } from 'redux-saga'

export interface NotificationsData {
  title: string
  message: string
  sound: NotificationsSounds
  communityId: string
  channelName: string
  yourBrowserWindow: Electron.BrowserWindow
}

export interface createNotificationsCallsDataType {
  action: {
    payload: IncomingMessages
    type: string
  }
  publicChannels: PublicChannel[]
  usersData: {
    [pubKey: string]: User
  }
  myIdentity: Identity
  currentChannel: string
  notificationsOption: NotificationsOptions
  notificationsSound: NotificationsSounds
  lastConnectedTime: number
}

export function* bridgeAction(action): Generator {
  yield* put(action)
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
    lastConnectedTime: yield* select(connection.selectors.lastConnectedTime)
  }

  const notificationClickedChannel = yield* call(messagesMapForNotificationsCalls, createNotificationsCallsData)

  yield* takeEvery(notificationClickedChannel, bridgeAction)
}
export const messagesMapForNotificationsCalls = (
  {
    action, currentChannel, myIdentity, notificationsOption,
    notificationsSound, publicChannels, usersData, lastConnectedTime
  }: createNotificationsCallsDataType
) => {
  return eventChannel<ReturnType<typeof channels.actions.setCurrentChannel>>(emit => {
    for (const messageData of action.payload.messages) {
      const publicChannelFromMessage = publicChannels.find((channel) => {
        // @ts-expect-error
        if (messageData?.channelId) {
          // @ts-expect-error
          return channel.address === messageData.channelId
        } else if (messageData?.channelAddress) {
          return channel.address === messageData.channelAddress
        }
      })
      const senderName = usersData[messageData.pubKey]?.username
      const isMessageFromMyUser = senderName === myIdentity.nickname
      const isMessageFromCurrentChannel = currentChannel === publicChannelFromMessage.name
      const isNotificationsOptionOff = NotificationsOptions.doNotNotifyOfAnyMessages === notificationsOption

      const [yourBrowserWindow] = remote.BrowserWindow.getAllWindows()
      const isAppInForeground = yourBrowserWindow.isFocused()

      const isMessageFromLoggedTime = messageData.createdAt > lastConnectedTime

      if (!isMessageFromMyUser && (!isMessageFromCurrentChannel || !isAppInForeground) && !isNotificationsOptionOff && isMessageFromLoggedTime) {
        return createNotification({
          title: `New message from ${senderName || 'unknown user'} in #${publicChannelFromMessage.name || 'Unnamed'}`,
          message: `${messageData.message.substring(0, 64)}${messageData.message.length > 64 ? '...' : ''}`,
          sound: notificationsSound,
          communityId: action.payload.communityId,
          channelName: publicChannelFromMessage.name,
          yourBrowserWindow
        }, emit)
      }
    }
    return () => { }
  })
}

export const createNotification = (payload: NotificationsData, emit): any => {
  if (process.platform === 'win32') {
    app.setAppUserModelId(app.name)
  }
  if (soundTypeToAudio[payload.sound]) {
    soundTypeToAudio[payload.sound].play()
  }
  const notification = new Notification(payload.title, {
    body: payload.message,
    icon: '../../build' + '/icon.png',
    silent: true
  })
  notification.onclick = () => {
    emit(channels.actions.setCurrentChannel({
      channelAddress: payload.channelName,
      communityId: payload.communityId
    }))
    payload.yourBrowserWindow.show()

    emit(END)
  }

  notification.onclose = () => {
    emit(END)
  }

  return () => { }
}

export default {
  createNotification
}
