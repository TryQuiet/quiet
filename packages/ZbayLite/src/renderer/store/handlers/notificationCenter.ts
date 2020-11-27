import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes, notificationFilterType } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'
import notificationCenterSelector from '../selectors/notificationCenter'
import directMessageChannelSelector from '../selectors/directMessageChannel'
import channelSelector from '../selectors/channel'

import { ActionsType, PayloadType } from './types'

// TODO: to remove, keeping for test purpose
export const NotificationsCenter = {
  channels: {},
  user: {},
  contacts: {}
}

class NotificationCenter {
  channels: { [id: string]: number }
  user: {
    filterType?: number
    sound?: number
  }
  contacts: {
    [id: string]: number
  }

  constructor(values?: Partial<NotificationCenter>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: NotificationCenter = {
  ...new NotificationCenter({
    channels: {},
    user: {},
    contacts: {}
  })
}

const setChannelNotificationFilter = createAction<{ channelId: string; filterType: number }>(
  actionTypes.SET_CHANNEL_NOTIFICATION_FILTER
)
const setChannelNotificationSettings = createAction<{
  channelsData: { [id: string]: number }
}>(actionTypes.SET_CHANNELS_NOTIFICATION_SETTINGS)
const setUserNotificationFilter = createAction<{ filterType: number }>(
  actionTypes.SET_USER_NOTIFICATION_FILTER
)
const setUserNotificationSettings = createAction<{
  userData: { filterType: number; sound: number }
}>(actionTypes.SET_USER_NOTIFICATION_SETTINGS)
const setContactNotificationFilter = createAction<{ contact: string; filterType: number }>(
  actionTypes.SET_CONTACT_NOTIFICATION_FILTER
)
const setContactsNotificationSettings = createAction<{ contacts: { [id: string]: number } }>(
  actionTypes.SET_CONTACTS_NOTIFICATION_SETTINGS
)
const setUserNotificationSound = createAction<{ sound: number }>(
  actionTypes.SET_USER_NOTIFICATION_SOUND
)

export const actions = {
  setChannelNotificationFilter,
  setChannelNotificationSettings,
  setUserNotificationFilter,
  setUserNotificationSettings,
  setContactNotificationFilter,
  setContactsNotificationSettings,
  setUserNotificationSound
}

export type NotificationCenterActions = ActionsType<typeof actions>

export const init = () => async (dispatch, getState) => {
  if (!electronStore.get('notificationCenter')) {
    electronStore.set(
      'notificationCenter',
      notificationCenterSelector.notificationCenter(getState())
    )
  }
  const notificationData = electronStore.get('notificationCenter')
  await dispatch(
    setUserNotificationSettings({
      userData: notificationData.user
    })
  )
  await dispatch(
    setContactsNotificationSettings({
      contacts: notificationData.contacts
    })
  )
  await dispatch(
    setChannelNotificationSettings({
      channelsData: notificationData.channels
    })
  )
}
export const setChannelsNotification = filterType => async (dispatch, getState) => {
  const channel = channelSelector.channel(getState())
  electronStore.set(`notificationCenter.channels.${channel.id}`, filterType)
  dispatch(
    setChannelNotificationFilter({
      channelId: channel.id,
      filterType: filterType
    })
  )
}
export const setContactNotification = filterType => async (dispatch, getState) => {
  const address = directMessageChannelSelector.targetRecipientAddress(getState())
  electronStore.set(`notificationCenter.contacts.${address}`, filterType)
  dispatch(
    setContactNotificationFilter({
      contact: address,
      filterType: filterType
    })
  )
}
export const unblockUserNotification = address => async (dispatch, getState) => {
  electronStore.set(`notificationCenter.contacts.${address}`, notificationFilterType.ALL_MESSAGES)
  dispatch(
    setContactNotificationFilter({
      contact: address,
      filterType: notificationFilterType.ALL_MESSAGES
    })
  )
}
export const setUserNotification = filterType => async (dispatch, getState) => {
  electronStore.set(`notificationCenter.user.filterType`, filterType)
  dispatch(
    setUserNotificationFilter({
      filterType: filterType
    })
  )
}
export const setUserNotificationsSound = sound => async (dispatch, getState) => {
  electronStore.set(`notificationCenter.user.sound`, sound)
  dispatch(
    setUserNotificationSound({
      sound: sound
    })
  )
}

export const epics = {
  init,
  setChannelsNotification,
  setUserNotification,
  setContactNotification,
  setUserNotificationsSound,
  unblockUserNotification
}

export const reducer = handleActions<NotificationCenter, PayloadType<NotificationCenterActions>>(
  {
    [setChannelNotificationFilter.toString()]: (
      state,
      {
        payload: { channelId, filterType }
      }: NotificationCenterActions['setChannelNotificationFilter']
    ) =>
      produce(state, draft => {
        draft.channels[channelId] = filterType
      }),
    [setContactNotificationFilter.toString()]: (
      state,
      {
        payload: { contact, filterType }
      }: NotificationCenterActions['setContactNotificationFilter']
    ) =>
      produce(state, draft => {
        draft.contacts[contact] = filterType
      }),
    [setUserNotificationFilter.toString()]: (
      state,
      { payload: { filterType } }: NotificationCenterActions['setUserNotificationFilter']
    ) =>
      produce(state, draft => {
        draft.user = {
          ...draft.user,
          filterType: filterType
        }
      }),
    [setUserNotificationSound.toString()]: (
      state,
      { payload: { sound } }: NotificationCenterActions['setUserNotificationSound']
    ) =>
      produce(state, draft => {
        draft.user = {
          ...draft.user,
          sound: sound
        }
      }),
    [setUserNotificationSettings.toString()]: (
      state,
      { payload: { userData } }: NotificationCenterActions['setUserNotificationSettings']
    ) =>
      produce(state, draft => {
        draft.user = userData
      }),
    [setChannelNotificationSettings.toString()]: (
      state,
      { payload: { channelsData } }: NotificationCenterActions['setChannelNotificationSettings']
    ) =>
      produce(state, draft => {
        draft.channels = channelsData
      }),
    [setContactsNotificationSettings.toString()]: (
      state,
      { payload: { contacts } }: NotificationCenterActions['setContactsNotificationSettings']
    ) =>
      produce(state, draft => {
        draft.contacts = contacts
      })
  },
  initialState
)
export default {
  actions,
  epics,
  reducer
}
