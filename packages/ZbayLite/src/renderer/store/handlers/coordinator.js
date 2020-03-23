import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import channelsSelectors from '../selectors/channels'
import channelSelectors from '../selectors/channel'
import messagesHandlers from './messages'
import contactsHandlers from './contacts'
import nodeHandlers from './node'
import identityHandlers from './identity'
import usersHandlers from './users'
import publicChannelsHandlers from './publicChannels'
import { actionTypes } from '../../../shared/static'

export const Coordinator = Immutable.Record(
  {
    running: true
  },
  'Coordinator'
)

export const initialState = Coordinator()

export const stopCoordinator = createAction(actionTypes.STOP_COORDINATOR)
export const startCoordinator = createAction(actionTypes.START_COORDINATOR)

export const channelCoordinator = async (dispatch, getState) => {
  const checkTargetChannelMessages = async () => {
    const currentChannel = channelSelectors.channel(getState())
    const { id: channelId } = currentChannel
    const action = channelId ? () => messagesHandlers.epics.fetchMessages(currentChannel)
      : () => contactsHandlers.epics.fetchMessages()
    await dispatch(action())
    setTimeout(checkTargetChannelMessages, 1000)
  }
  checkTargetChannelMessages()
}

const actions = {
  stopCoordinator,
  startCoordinator
}

const coordinator = () => async (dispatch, getState) => {
  channelCoordinator(dispatch, getState)
  const fetchData = async () => {
    const actions = channelsSelectors
      .data(getState())
      .map(channel => () => messagesHandlers.epics.fetchMessages(channel))
      .push(() => contactsHandlers.epics.fetchMessages())
      .push(() => nodeHandlers.epics.getStatus())
      .push(() => identityHandlers.epics.fetchBalance())
      .push(() => identityHandlers.epics.fetchFreeUtxos())
      .push(() => usersHandlers.epics.fetchUsers())
      .push(() => publicChannelsHandlers.epics.fetchPublicChannels())
    for (let index = 0; index < actions.size; index++) {
      await dispatch(actions.get(index % actions.size)())
    }
    setTimeout(fetchData, 15000)
  }
  fetchData()
}
const epics = {
  coordinator
}

export const reducer = handleActions(
  {
    [startCoordinator]: state => state.set('running', true),
    [stopCoordinator]: state => state.set('running', false)
  },
  initialState
)

export default {
  epics,
  actions,
  reducer
}
