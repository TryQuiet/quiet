/* global Notification */
import { PayloadAction } from '@reduxjs/toolkit'
import { Identity, identity, IncomingMessages, NotificationsOptions, NotificationsSounds, PublicChannel, publicChannels as channels, settings, User, users } from '@quiet/nectar'
import { all, call, SagaGenerator, select } from 'typed-redux-saga'
import { CallEffect } from 'redux-saga/effects'
import { remote } from 'electron'
import { soundTypeToAudio } from '../shared/sounds'
import create from './store/create'

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
    notificationsSound: yield* select(settings.selectors.getNotificationsSound)
  }
  const createNotificationsCalls = yield* call(messagesMapForNotificationsCalls, createNotificationsCallsData)

  yield* all(createNotificationsCalls)
}

export const messagesMapForNotificationsCalls = (
  {
    action, currentChannel, myIdentity, notificationsOption,
    notificationsSound, publicChannels, usersData
  }: createNotificationsCallsDataType
): Array<SagaGenerator<Notification, CallEffect<Notification>>> => {
  return action.payload.messages.map((messageData) => {
    const publicChannelFromMessage = publicChannels.find((channel) => {
      //@ts-ignore
      if (messageData?.channelId) return channel.address === messageData.channelId
      else if (messageData?.channelAddress) return channel.address === messageData.channelAddress
    })
    const isMessageFromMyUser = usersData[messageData.pubKey]?.username === myIdentity.nickname
    // it will change name with address
    const isMessageFromCurrentChannel = currentChannel === publicChannelFromMessage.name
    const isNotificationsOptionOff = NotificationsOptions.doNotNotifyOfAnyMessages === notificationsOption

    const [yourBrowserWindow] = remote.BrowserWindow.getAllWindows()
    const isAppInForeground = yourBrowserWindow.isFocused()

    if (!isMessageFromMyUser && (!isMessageFromCurrentChannel || !isAppInForeground) && !isNotificationsOptionOff) {
      return call(createNotification, {
        title: `New message in ${publicChannelFromMessage.name || 'Unnamed'}`,
        message: `${messageData.message.substring(0, 64)}${messageData.message.length > 64 ? '...' : ''}`,
        sound: notificationsSound,
        communityId: action.payload.communityId,
        channelName: publicChannelFromMessage.name,
        yourBrowserWindow
      })
    }
  })
}

export const createNotification = (payload: NotificationsData): Notification => {
  if (soundTypeToAudio[payload.sound]) {
    soundTypeToAudio[payload.sound].play()
  }
  const notification = new Notification(payload.title, { body: payload.message })
  notification.onclick = () => {
    create().dispatch(channels.actions.setCurrentChannel({
      channelAddress: payload.channelName,
      communityId: payload.communityId
    }))

    payload.yourBrowserWindow.show()
  }

  return notification
}

export default {
  createNotification
}
