/* global Notification */
import { shell } from 'electron'
import { call, select, fork, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  connection,
  settings,
  identity,
  users,
  messages,
  publicChannels,
  MessageType,
  NotificationsOptions,
  NotificationsSounds,
  files,
  FileMetadata,
  DownloadState
} from '@quiet/state-manager'
import { soundTypeToAudio } from '../../../shared/sounds'
import { eventChannel } from 'redux-saga'
import { takeEvery } from 'redux-saga/effects'

// eslint-disable-next-line
const remote = require('@electron/remote')

export interface NotificationData {
  label: string
  body?: string
  channel: string
  sound: NotificationsSounds
}

export function* displayMessageNotificationSaga(
  action: PayloadAction<ReturnType<typeof messages.actions.incomingMessages>['payload']>
): Generator {
  const incomingMessages = action.payload.messages

  const currentChannelId = yield* select(publicChannels.selectors.currentChannelId)
  const publicChannelsSelector = yield* select(publicChannels.selectors.publicChannels)

  const currentIdentity = yield* select(identity.selectors.currentIdentity)
  const certificatesMapping = yield* select(users.selectors.certificatesMapping)

  const lastConnectedTime = yield* select(connection.selectors.lastConnectedTime)

  const downloadStatuses = yield* select(files.selectors.downloadStatuses)

  const notificationsConfig = yield* select(settings.selectors.getNotificationsOption)
  const notificationsSound = yield* select(settings.selectors.getNotificationsSound)

  for (const message of incomingMessages) {
    const focused = yield* call(isWindowFocused)
    const channelName = publicChannelsSelector.find((channel) => channel.id === message.channelId).name

    // Do not display notifications for active channel (when the app is in foreground)
    if (focused && message.channelId === currentChannelId) return

    // Do not display notifications for own messages
    const sender = certificatesMapping[message.pubKey]?.username
    if (!sender || sender === currentIdentity.nickname) return

    // Do not display notifications if turned off in configuration
    if (notificationsConfig === NotificationsOptions.doNotNotifyOfAnyMessages) return

    // Do not display notification if message is old
    if (message.createdAt <= lastConnectedTime) return

    // Do not display when message is not verified
    if (!action.payload.isVerified) return

    let label = `New message from @${sender} in #${channelName}`
    let body = `${message.message.substring(0, 64)}${message.message.length > 64 ? '...' : ''}`

    // Change notification's label for the image
    if (message.type === MessageType.Image) {
      label = `@${sender} sent an image in #${channelName}`
      body = undefined
    }

    // Change notification's label for the file
    if (message.type === MessageType.File) {
      const status = downloadStatuses[message.id]

      label = `@${sender} sends file in #${channelName}`
      body = undefined

      if (status?.downloadState === DownloadState.Completed) {
        label = `@${sender} sent a file in #${channelName}`
        body = 'Download complete. Click to show file in folder.'
      }
    }

    const channel = message.channelId
    const type = message.type
    const media = message.media

    const notificationData: NotificationData = {
      label: label,
      body: body,
      channel: channel,
      sound: notificationsSound
    }

    const notification = yield* call(createNotification, notificationData)
    yield* fork(handleNotificationActions, notification, type, channel, media)
  }
}

export const isWindowFocused = (): boolean => {
  const [browserWindow] = remote.BrowserWindow.getAllWindows()
  return browserWindow.isFocused()
}

export const createNotification = (notificationData: NotificationData): Notification => {
  if (process.platform === 'win32') {
    remote.app.setAppUserModelId(remote.app.name)
  }

  const { sound, label, body } = notificationData

  if (soundTypeToAudio[sound]) {
    soundTypeToAudio[sound].volume = 0.2
    soundTypeToAudio[sound].play()
  }

  return new Notification(label, {
    body: body,
    icon: '../../build' + '/icon.png',
    silent: true
  })
}

export function* handleNotificationActions(
  notification: Notification,
  type: MessageType,
  channel: string,
  media?: FileMetadata
): Generator {
  const events = yield* call(subscribeNotificationEvents, notification, type, channel, media)
  yield takeEvery(events, function* (action) {
    yield put(action)
  })
}

function subscribeNotificationEvents(
  notification: Notification,
  type: MessageType,
  channel: string,
  media?: FileMetadata
) {
  return eventChannel<ReturnType<typeof publicChannels.actions.setCurrentChannel>>(emit => {
    notification.onclick = () => {
      if (type === MessageType.File && media.path) {
        shell.showItemInFolder(media.path)
      } else {
        const [browserWindow] = remote.BrowserWindow.getAllWindows()
        browserWindow.show()
        // Emit store action
        emit(publicChannels.actions.setCurrentChannel({ channelId: channel }))
      }
    }
    return () => {}
  })
}
