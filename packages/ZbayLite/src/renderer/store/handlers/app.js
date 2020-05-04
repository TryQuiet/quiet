import { ipcRenderer, remote } from 'electron'
import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'
import { actionCreators } from './modals'

export const AppState = Immutable.Record(
  {
    version: null,
    transfers: Immutable.Map(),
    newUser: false,
    modalTabToOpen: null,
    allTransfersCount: 0,
    newTransfersCounter: 0
  },
  'AppState'
)

export const initialState = AppState()

const loadVersion = createAction(actionTypes.SET_APP_VERSION, () =>
  remote.app.getVersion()
)
const setTransfers = createAction(actionTypes.SET_TRANSFERS)
const setModalTab = createAction(actionTypes.SET_CURRENT_MODAL_TAB)
const clearModalTab = createAction(actionTypes.CLEAR_CURRENT_MODAL_TAB)
const setAllTransfersCount = createAction(actionTypes.SET_ALL_TRANSFERS_COUNT)
const setNewTransfersCount = createAction(actionTypes.SET_NEW_TRANSFERS_COUNT)
const reduceNewTransfersCount = createAction(
  actionTypes.REDUCE_NEW_TRANSFERS_COUNT
)

export const actions = {
  loadVersion,
  setTransfers,
  setModalTab,
  clearModalTab,
  setAllTransfersCount,
  setNewTransfersCount,
  reduceNewTransfersCount
}

export const askForBlockchainLocation = () => async (dispatch, getState) => {
  dispatch(actionCreators.openModal('blockchainLocation')())
}

export const proceedWithSyncing = (payload) => async (dispatch, getState) => {
  ipcRenderer.send('proceed-with-syncing', payload)
  dispatch(actionCreators.closeModal('blockchainLocation')())
}

export const reducer = handleActions(
  {
    [setNewTransfersCount]: (state, { payload: setNewTransfersCount }) =>
      state.set('newTransfersCounter', setNewTransfersCount),
    [reduceNewTransfersCount]: (state, { payload: amount }) =>
      state.update('newTransfersCounter', count => count - amount),
    [loadVersion]: (state, { payload: version }) =>
      state.set('version', version),
    [setModalTab]: (state, { payload: tabName }) =>
      state.set('modalTabToOpen', tabName),
    [setAllTransfersCount]: (state, { payload: transfersCount }) =>
      state.set('allTransfersCount', transfersCount),
    [clearModalTab]: state => state.set('modalTabToOpen', null),
    [setTransfers]: (state, { payload: { id, value } }) => {
      return state.setIn(['transfers', id], value)
    }
  },
  initialState
)

export const epics = {
  askForBlockchainLocation,
  proceedWithSyncing
}

export default {
  epics,
  actions,
  reducer
}
