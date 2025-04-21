/* global Notification */
import { shell } from 'electron'
import { call, select, fork, put } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  connection,
  settings,
  users,
  messages,
  publicChannels,
  NotificationsOptions,
  NotificationsSounds,
  files,
} from '@quiet/state-manager'
import { MessageType, FileMetadata, DownloadState } from '@quiet/types'
import { soundTypeToAudio } from '../../../shared/sounds'
import { eventChannel } from 'redux-saga'
import { takeEvery } from 'redux-saga/effects'
import { createLogger } from '../../logger'

const logger = createLogger('notifications.saga')

// eslint-disable-next-line
const remote = require('@electron/remote')

export interface NotificationData {
  label: string
  body?: string
  channel: string
  sound: NotificationsSounds
}

export function* displayMessageNotificationSaga(
  action: PayloadAction<ReturnType<typeof messages.actions.addMessages>['payload']>
): Generator {
  const incomingMessages = action.payload.messages

  const currentChannelId = yield* select(publicChannels.selectors.currentChannelId)
  const publicChannelsSelector = yield* select(publicChannels.selectors.publicChannels)
  const myUserProfile = yield* select(users.selectors.myUserProfile)
  const myUserId = myUserProfile?.userId || ''

  const lastConnectedTime = yield* select(connection.selectors.lastConnectedTime)

  const downloadStatuses = yield* select(files.selectors.downloadStatuses)

  const notificationsConfig = yield* select(settings.selectors.getNotificationsOption)
  const notificationsSound = yield* select(settings.selectors.getNotificationsSound)

  for (const message of incomingMessages) {
    const focused = yield* call(isWindowFocused)
    const channelName = publicChannelsSelector.find(channel => channel.id === message.channelId)?.name

    // Do not display notifications for active channel (when the app is in foreground)
    if (focused && message.channelId === currentChannelId) return

    // Do not display notifications for own messages
    const sender = message.userId
    if (!sender || !myUserId || sender === myUserId) {
      logger.debug('Notification ignored: own message')
      return
    }
    const senderProfile = yield* select(users.selectors.getUserProfileById(sender))
    if (!senderProfile) {
      logger.info('Notification ignored: sender profile not found')
      return
    }
    const senderName = senderProfile.nickname
    logger.info(`Notification: ${senderName} sent a message in #${channelName}`)
    // Do not display notifications if turned off in configuration
    if (notificationsConfig === NotificationsOptions.doNotNotifyOfAnyMessages) return

    // Do not display notification if message is old
    if (message.createdAt <= lastConnectedTime) return

    // Do not display when message is not verified
    if (!action.payload.isVerified) return

    let label = `New message from @${senderName} in #${channelName}`
    let body: string | undefined = `${message.message.substring(0, 64)}${message.message.length > 64 ? '...' : ''}`

    // Change notification's label for the image
    if (message.type === MessageType.Image) {
      label = `@${senderName} sent an image in #${channelName}`
      body = undefined
    }

    // Change notification's label for the file
    if (message.type === MessageType.File) {
      const status = downloadStatuses[message.id]

      label = `@${senderName} sends file in #${channelName}`
      body = undefined

      if (status?.downloadState === DownloadState.Completed) {
        label = `@${senderName} sent a file in #${channelName}`
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
      sound: notificationsSound,
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
  const notificationSound = soundTypeToAudio[sound]
  if (notificationSound) {
    notificationSound.volume = 0.2
    void notificationSound.play()
  }

  return new Notification(label, {
    body: body,
    icon: '../../build' + '/icon.png',
    silent: true,
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
      if (type === MessageType.File && media?.path) {
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
