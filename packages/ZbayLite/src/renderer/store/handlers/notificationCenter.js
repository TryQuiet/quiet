import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes, notificationFilterType } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'
import notificationCenterSelector from '../selectors/notificationCenter'
import directMessageChannelSelector from '../selectors/directMessageChannel'
import channelSelector from '../selectors/channel'
import logsHandlers from '../handlers/logs'

export const NotificationsCenter = {
  channels: {},
  user: {},
  contacts: {}
}

export const initialState = {
  ...NotificationsCenter
}

const setChannelNotificationFilter = createAction(
  actionTypes.SET_CHANNEL_NOTIFICATION_FILTER
)
const setChannelNotificationSettings = createAction(
  actionTypes.SET_CHANNELS_NOTIFICATION_SETTINGS
)
const setUserNotificationFilter = createAction(
  actionTypes.SET_USER_NOTIFICATION_FILTER
)
const setUserNotificationSettings = createAction(
  actionTypes.SET_USER_NOTIFICATION_SETTINGS
)
const setContactNotificationFilter = createAction(
  actionTypes.SET_CONTACT_NOTIFICATION_FILTER
)
const setContactsNotificationSettings = createAction(
  actionTypes.SET_CONTACTS_NOTIFICATION_SETTINGS
)
const setUserNotificationSound = createAction(
  actionTypes.SET_USER_NOTIFICATION_SOUND
)
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
export const setChannelsNotification = filterType => async (
  dispatch,
  getState
) => {
  const channel = channelSelector.channel(getState())
  electronStore.set(
    `notificationCenter.channels.${channel.id}`,
    filterType
  )
  dispatch(
    setChannelNotificationFilter({
      channelId: channel.id,
      filterType: filterType
    })
  )
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting notification filter type for channel: ${filterType}` }))
}
export const setContactNotification = filterType => async (
  dispatch,
  getState
) => {
  const address = directMessageChannelSelector.targetRecipientAddress(
    getState()
  )
  electronStore.set(`notificationCenter.contacts.${address}`, filterType)
  dispatch(
    setContactNotificationFilter({
      contact: address,
      filterType: filterType
    })
  )
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting notification for contact: ${address}` }))
}
export const unblockUserNotification = address => async (
  dispatch,
  getState
) => {
  electronStore.set(
    `notificationCenter.contacts.${address}`,
    notificationFilterType.ALL_MESSAGES
  )
  dispatch(
    setContactNotificationFilter({
      contact: address,
      filterType: notificationFilterType.ALL_MESSAGES
    })
  )
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Unblocking notification for user: ${address}` }))
}
export const setUserNotification = filterType => async (dispatch, getState) => {
  electronStore.set(`notificationCenter.user.filterType`, filterType)
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting notification filter type: ${filterType}` }))
  dispatch(
    setUserNotificationFilter({
      filterType: filterType
    })
  )
}
export const setUserNotificationsSound = sound => async (
  dispatch,
  getState
) => {
  electronStore.set(`notificationCenter.user.sound`, sound)
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Setting notifiaction sound: ${sound}` }))
  dispatch(
    setUserNotificationSound({
      sound: sound
    })
  )
}
export const actions = {
  setChannelNotificationFilter,
  setUserNotificationFilter,
  setContactNotificationFilter,
  setContactsNotificationSettings,
  setUserNotificationSound
}

export const epics = {
  init,
  setChannelsNotification,
  setUserNotification,
  setContactNotification,
  setUserNotificationsSound,
  unblockUserNotification
}

export const reducer = handleActions(
  {
    [setChannelNotificationFilter]: (
      state,
      { payload: { channelId, filterType } }
    ) =>
      produce(state, (draft) => {
        draft.channels[channelId] = filterType
      }),
    [setContactNotificationFilter]: (
      state,
      { payload: { contact, filterType } }
    ) =>
      produce(state, (draft) => {
        draft.contacts[contact] = filterType
      }),
    [setUserNotificationFilter]: (state, { payload: { filterType } }) =>
      produce(state, (draft) => {
        draft.user = {
          ...draft.user,
          filterType: filterType
        }
      }),
    [setUserNotificationSound]: (state, { payload: { sound } }) =>
      produce(state, (draft) => {
        draft.user = {
          ...draft.user,
          sound: sound
        }
      }),
    [setUserNotificationSettings]: (state, { payload: { userData } }) =>
      produce(state, (draft) => {
        draft.user = userData
      }),
    [setChannelNotificationSettings]: (state, { payload: { channelsData } }) =>
      produce(state, (draft) => {
        draft.channels = channelsData
      }),
    [setContactsNotificationSettings]: (state, { payload: { contacts } }) =>
      produce(state, (draft) => {
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
