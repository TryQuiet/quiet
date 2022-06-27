/* global Notification */
import { PayloadAction } from '@reduxjs/toolkit'
import { eventChannel, END } from 'redux-saga'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import {
  connection,
  Identity,
  identity,
  messages,
  IncomingMessages,
  NotificationsOptions,
  NotificationsSounds,
  PublicChannel,
  publicChannels as channels,
  settings,
  User,
  users,
  MessageType
} from '@quiet/state-manager'
import { soundTypeToAudio } from '../../../shared/sounds'

// eslint-disable-next-line
const remote = require('@electron/remote')

export interface NotificationsData {
  title: string
  message: string
  sound: NotificationsSounds
  channelName: string
  browserWindow: Electron.BrowserWindow
}

export interface CreateNotificationsCallsDataType {
  action: {
    payload: IncomingMessages
    type: string
  }
  publicChannels: PublicChannel[]
  usersData: {
    [pubKey: string]: User
  }
  identity: Identity
  currentChannelAddress: string
  notificationsOption: NotificationsOptions
  notificationsSound: NotificationsSounds
  lastConnectedTime: number
}

export function* bridgeAction(action): Generator {
  yield* put(action)
}

export function* displayMessageNotificationSaga(
  action: PayloadAction<ReturnType<typeof messages.actions.incomingMessages>['payload']>
): Generator {
  const createNotificationsCallsData: CreateNotificationsCallsDataType = {
    action,
    publicChannels: yield* select(channels.selectors.publicChannels),
    usersData: yield* select(users.selectors.certificatesMapping),
    identity: yield* select(identity.selectors.currentIdentity),
    currentChannelAddress: yield* select(channels.selectors.currentChannelAddress),
    notificationsOption: yield* select(settings.selectors.getNotificationsOption),
    notificationsSound: yield* select(settings.selectors.getNotificationsSound),
    lastConnectedTime: yield* select(connection.selectors.lastConnectedTime)
  }

  const notificationClickedChannel = yield* call(
    messagesMapForNotificationsCalls,
    createNotificationsCallsData
  )

  yield* takeEvery(notificationClickedChannel, bridgeAction)
}

export const messagesMapForNotificationsCalls = (data: CreateNotificationsCallsDataType) => {
  return eventChannel<ReturnType<typeof channels.actions.setCurrentChannel>>(emit => {
    for (const message of data.action.payload.messages) {
      const messageChannel = data.publicChannels.find(channel => channel.address === message.channelAddress)

      const senderName = data.usersData[message.pubKey]?.username

      const isMessageFromMyUser = senderName === data.identity.nickname
      const isMessageFromCurrentChannel = data.currentChannelAddress === messageChannel?.address
      const isNotificationsOptionOff =
        NotificationsOptions.doNotNotifyOfAnyMessages === data.notificationsOption

      const [browserWindow] = remote.BrowserWindow.getAllWindows()

      const isAppInForeground = browserWindow.isFocused()

      const isMessageFromLoggedTime = message.createdAt > data.lastConnectedTime
      if (senderName && !isMessageFromMyUser && !isNotificationsOptionOff && isMessageFromLoggedTime && (!isMessageFromCurrentChannel || !isAppInForeground)) {
        let notificationText: string
        let title: string

        if (message.type === MessageType.Image) {
          title = `${senderName} in #${messageChannel.name || 'Unnamed'}`
          notificationText = 'shared this image'
        } else {
          title = `New message from ${senderName} in #${messageChannel.name || 'Unnamed'}`
          notificationText = message.message
        }

        return createNotification({
          title,
          message: `${notificationText.substring(0, 64)}${notificationText.length > 64 ? '...' : ''}`,
          sound: data.notificationsSound,
          channelName: messageChannel?.name,
          browserWindow: browserWindow
        }, emit)
      }
    }
    return () => { }
  })
}

export const createNotification = (payload: NotificationsData, emit): any => {
  if (process.platform === 'win32') {
    remote.app.setAppUserModelId(remote.app.name)
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
    emit(
      channels.actions.setCurrentChannel({
        channelAddress: payload.channelName
      })
    )
    payload.browserWindow.show()

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
