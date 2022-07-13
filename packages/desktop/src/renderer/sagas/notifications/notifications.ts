/* global Notification */
import store from '../../store'
import { call, select } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  connection,
  settings,
  identity,
  users,
  messages as _messages,
  publicChannels as _channels,
  MessageType,
  NotificationsOptions,
  NotificationsSounds,
} from '@quiet/state-manager'
import { soundTypeToAudio } from '../../../shared/sounds'

// eslint-disable-next-line
const remote = require('@electron/remote')

export interface NotificationData {
  label: string
  body: string
  channel: string
  sound: NotificationsSounds
  browserWindow: Electron.BrowserWindow
}

export function* displayMessageNotificationSaga(
  action: PayloadAction<ReturnType<typeof _messages.actions.incomingMessages>['payload']>
): Generator {

  const { messages } = action.payload

  // Do not display notification if app is in foreground
  const browserWindow = (yield* call(remote.BrowserWindow.getAllWindows)) as unknown as Electron.BrowserWindow
  if (browserWindow.isFocused()) return

  const currentChannel = yield* select(_channels.selectors.currentChannel)
  const currentIdentity = yield* select(identity.selectors.currentIdentity)
  const certificatesMapping = yield* select(users.selectors.certificatesMapping)

  const lastConnectedTime = yield* select(connection.selectors.lastConnectedTime)

  const notificationsConfig = yield* select(settings.selectors.getNotificationsOption)
  const notificationsSound = yield* select(settings.selectors.getNotificationsSound)

  for (const message of messages) {
    const sender = certificatesMapping[message.pubKey].username

    // Do not display notifications for active channel
    if (message.channelAddress === currentChannel.address) return

    // Do not display notifications for own messages
    if (sender === currentIdentity.nickname) return

    // Do not display notifications if turned off in configuration
    if (notificationsConfig === NotificationsOptions.doNotNotifyOfAnyMessages) return

    // Do not display notification if message is old
    if (message.createdAt <= lastConnectedTime) return

    let label: string
    let body: string

    switch (message.type) {
      case MessageType.Image:
        label = `${sender} in #${message.channelAddress}`
        body = 'shared this image'
      default:
        label = `New message from ${sender} in #${message.channelAddress}`
        body = `${message.message.substring(0, 64)}${message.message.length > 64 ? '...' : ''}`
    }

    const notificationData: NotificationData = {
      label: label,
      body: body,
      channel: message.channelAddress,
      sound: notificationsSound,
      browserWindow: browserWindow
    }

    yield* call(createNotification, notificationData)
  }
}

export const createNotification = (payload: NotificationData) => {
  if (process.platform === 'win32') {
    remote.app.setAppUserModelId(remote.app.name)
  }

  if (soundTypeToAudio[payload.sound]) {
    soundTypeToAudio[payload.sound].play()
  }

  const notification = new Notification(payload.label, {
    body: payload.body,
    icon: '../../build' + '/icon.png',
    silent: true
  })

  notification.onclick = () => {
    store.dispatch(
      _channels.actions.setCurrentChannel({
        channelAddress: payload.channel
      })
    )
    payload.browserWindow.show()
  }
}
