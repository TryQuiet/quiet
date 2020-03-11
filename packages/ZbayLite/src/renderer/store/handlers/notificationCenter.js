import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'
import electronStore from '../../../shared/electronStore'
import notificationCenterSelector from '../selectors/notificationCenter'
import directMessageChannelSelector from '../selectors/directMessageChannel'
import channelSelector from '../selectors/channel'
export const NotificationsCenter = Immutable.Record(
  {
    channels: Immutable.Map(),
    user: Immutable.Map(),
    contacts: Immutable.Map()
  },
  'NotificationsCenter'
)
export const initialState = NotificationsCenter()

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
      userData: Immutable.fromJS(notificationData.user)
    })
  )
  await dispatch(
    setContactsNotificationSettings({
      contacts: Immutable.fromJS(notificationData.contacts)
    })
  )
  await dispatch(
    setChannelNotificationSettings({
      channelsData: Immutable.fromJS(notificationData.channels)
    })
  )
}
export const setChannelsNotification = filterType => async (
  dispatch,
  getState
) => {
  const channel = channelSelector.data(getState()).toJS()
  electronStore.set(
    `notificationCenter.channels.${channel.address}`,
    filterType
  )
  dispatch(
    setChannelNotificationFilter({
      channelId: channel.address,
      filterType: filterType
    })
  )
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
}
export const setUserNotification = filterType => async (dispatch, getState) => {
  electronStore.set(`notificationCenter.user.filterType`, filterType)
  dispatch(
    setUserNotificationFilter({
      filterType: filterType
    })
  )
}
export const actions = {
  setChannelNotificationFilter,
  setUserNotificationFilter,
  setContactNotificationFilter,
  setContactsNotificationSettings
}

export const epics = {
  init,
  setChannelsNotification,
  setUserNotification,
  setContactNotification
}

export const reducer = handleActions(
  {
    [setChannelNotificationFilter]: (
      state,
      { payload: { channelId, filterType } }
    ) =>
      state.update('channels', channels =>
        channels.merge({ [channelId]: filterType })
      ),
    [setContactNotificationFilter]: (
      state,
      { payload: { contact, filterType } }
    ) =>
      state.update('contacts', channels =>
        channels.merge({ [contact]: filterType })
      ),
    [setUserNotificationFilter]: (state, { payload: { filterType } }) =>
      state.update('user', user => user.merge({ filterType: filterType })),
    [setUserNotificationSettings]: (state, { payload: { userData } }) =>
      state.set('user', userData),
    [setChannelNotificationSettings]: (state, { payload: { channelsData } }) =>
      state.set('channels', channelsData),
    [setContactsNotificationSettings]: (state, { payload: { contacts } }) =>
      state.set('contacts', contacts)
  },
  initialState
)
export default {
  actions,
  epics,
  reducer
}
