import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import channelsSelectors from '../selectors/channels'
import coordinatorSelectors from '../selectors/coordinator'
import messagesHandlers from './messages'
import contactsHandlers from './contacts'
import nodeHandlers from './node'
import identityHandlers from './identity'
import usersHandlers from './users'

export const Coordinator = Immutable.Record(
  {
    running: true
  },
  'Coordinator'
)

export const initialState = Coordinator()

export const stopCoordinator = createAction('STOP_COORDINATOR')
export const startCoordinator = createAction('START_COORDINATOR')

const actions = {
  stopCoordinator,
  startCoordinator
}
const coordinator = () => async (dispatch, getState) => {
  let index = 0
  while (coordinatorSelectors.running(getState())) {
    const actions = channelsSelectors
      .data(getState())
      .map(channel => () => messagesHandlers.epics.fetchMessages(channel))
      .push(() => contactsHandlers.epics.fetchMessages())
      .push(() => nodeHandlers.epics.getStatus())
      .push(() => identityHandlers.epics.fetchBalance())
      .push(() => usersHandlers.epics.fetchUsers())
    await dispatch(actions.get(index % actions.size)())
    index += 1
  }
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
