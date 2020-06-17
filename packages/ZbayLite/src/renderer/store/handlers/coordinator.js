import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import channelsSelectors from '../selectors/channels'
import appSelectors from '../selectors/app'
import messagesHandlers from './messages'
import appHandlers from './app'
import contactsHandlers from './contacts'
import nodeHandlers from './node'
import identityHandlers from './identity'
import ratesHandlers from './rates'
import usersHandlers from './users'
import publicChannelsHandlers from './publicChannels'
import { actionTypes } from '../../../shared/static'
import { getClient } from '../../zcash'

export const Coordinator = Immutable.Record(
  {
    running: true
  },
  'Coordinator'
)

export const initialState = Coordinator()

export const stopCoordinator = createAction(actionTypes.STOP_COORDINATOR)
export const startCoordinator = createAction(actionTypes.START_COORDINATOR)

const actions = {
  stopCoordinator,
  startCoordinator
}

const coordinator = () => async (dispatch, getState) => {
  const channels = channelsSelectors.data(getState())
  let actions = channelsSelectors
    .data(getState())
    .map(channel => () => messagesHandlers.epics.fetchMessages(channel))
    .push(() => contactsHandlers.epics.fetchMessages())
    .push(() => publicChannelsHandlers.epics.fetchPublicChannels())
    .push(() => usersHandlers.epics.fetchUsers())
    .push(() => ratesHandlers.epics.fetchPrices())

  const statusActions = Immutable.List()
    .push(() => nodeHandlers.epics.getStatus())
    .push(() => identityHandlers.epics.fetchBalance())
    .push(() => identityHandlers.epics.fetchFreeUtxos())

  const fetchStatus = async () => {
    for (let index = 0; index < statusActions.size; index++) {
      await dispatch(statusActions.get(index)())
    }
    setTimeout(fetchStatus, 75000)
  }
  const fetchData = async () => {
    const res = await getClient().operations.getTransactionsCount()
    dispatch(contactsHandlers.epics.checkConfirmationOfTransfers)
    if (
      appSelectors.allTransfersCount(getState()) !==
      res.sprout + res.sapling
    ) {
      await dispatch(
        appHandlers.actions.setNewTransfersCount(
          res.sprout + res.sapling - appSelectors.allTransfersCount(getState())
        )
      )
      await dispatch(
        appHandlers.actions.setAllTransfersCount(res.sprout + res.sapling)
      )
    } else {
      setTimeout(fetchData, 5000)
      return
    }
    if (!Immutable.is(channels, channelsSelectors.data(getState()))) {
      actions = channelsSelectors
        .data(getState())
        .map(channel => () => messagesHandlers.epics.fetchMessages(channel))
        .push(() => contactsHandlers.epics.fetchMessages())
        .push(() => publicChannelsHandlers.epics.fetchPublicChannels())
        .push(() => usersHandlers.epics.fetchUsers())
        .push(() => ratesHandlers.epics.fetchPrices())
    }
    for (let index = 0; index < actions.size; index++) {
      if (appSelectors.newTransfersCounter(getState()) !== 0) {
        const recivedNew = await dispatch(actions.get(index % actions.size)())
        if (recivedNew === 1) {
          actions = actions.unshift(actions.get(index)).splice(index + 1, 1)
        }
      } else {
        console.log('skip coorninator')
        break
      }
    }
    setTimeout(fetchData, 5000)
  }
  setTimeout(fetchStatus, 75000)
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
