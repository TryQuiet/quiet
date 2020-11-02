import { produce } from 'immer'
import { ipcRenderer, remote } from 'electron'
import BigNumber from 'bignumber.js'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'
import { actionCreators } from './modals'
import nodeHandlers from './node'
import client from '../../zcash'
import history from '../../../shared/history'
import electronStore from '../../../shared/electronStore'

export const AppState = {
  version: null,
  transfers: {},
  newUser: false,
  modalTabToOpen: null,
  allTransfersCount: 0,
  newTransfersCounter: 0,
  directMessageQueueLock: false,
  messageQueueLock: false,
  isInitialLoadFinished: false,
  useTor: false
}

export const initialState = {
  ...AppState
}

const loadVersion = createAction(actionTypes.SET_APP_VERSION, () =>
  remote.app.getVersion()
)
const setTransfers = createAction(actionTypes.SET_TRANSFERS)
const setUseTor = createAction(actionTypes.SET_USE_TOR)
const setModalTab = createAction(actionTypes.SET_CURRENT_MODAL_TAB)
const clearModalTab = createAction(actionTypes.CLEAR_CURRENT_MODAL_TAB)
const setAllTransfersCount = createAction(actionTypes.SET_ALL_TRANSFERS_COUNT)
const setNewTransfersCount = createAction(actionTypes.SET_NEW_TRANSFERS_COUNT)
const lockDmQueue = createAction(actionTypes.LOCK_DM_QUEUE)
const unlockDmQueue = createAction(actionTypes.UNLOCK_DM_QUEUE)
const lockMessageQueue = createAction(actionTypes.LOCK_MESSAGE_QUEUE)
const unlockMessageQueue = createAction(actionTypes.UNLOCK_MESSAGE_QUEUE)
const setInitialLoadFlag = createAction(actionTypes.SET_INITIAL_LOAD_FLAG)
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
  reduceNewTransfersCount,
  lockDmQueue,
  unlockDmQueue,
  lockMessageQueue,
  unlockMessageQueue,
  setInitialLoadFlag,
  setUseTor
}

export const askForBlockchainLocation = () => async (dispatch, getState) => {
  dispatch(actionCreators.openModal('blockchainLocation')())
}

export const initializeUseTor = () => async (dispatch, getState) => {
  const savedUseTor = electronStore.get(`useTor`)
  if (savedUseTor !== undefined) {
    if (savedUseTor === true) {
      ipcRenderer.send('spawnTor')
    }
    dispatch(actions.setUseTor(savedUseTor))
  }
}

export const proceedWithSyncing = payload => async (dispatch, getState) => {
  ipcRenderer.send('proceed-with-syncing', payload)
  dispatch(actionCreators.closeModal('blockchainLocation')())
}

export const restartAndRescan = () => async (dispatch, getState) => {
  client.rescan()
  await dispatch(
    nodeHandlers.actions.setStatus({
      currentBlock: new BigNumber(0)
    })
  )
  await dispatch(nodeHandlers.actions.setIsRescanning(true))
  setTimeout(() => {
    history.push(`/vault`)
    electronStore.set('channelsToRescan', {})
    electronStore.set('isRescanned', true)
  }, 500)
}

export const reducer = handleActions(
  {
    [setNewTransfersCount]: (state, { payload: setNewTransfersCount }) =>
      produce(state, (draft) => {
        draft.newTransfersCounter = setNewTransfersCount
      }),
    [setInitialLoadFlag]: (state, { payload: flag }) =>
      produce(state, (draft) => {
        draft.isInitialLoadFinished = flag
      }),
    [setUseTor]: (state, { payload: flag }) => produce(state, (draft) => {
      draft.useTor = flag
    }),
    [reduceNewTransfersCount]: (state, { payload: amount }) =>
      produce(state, (draft) => {
        draft.newTransfersCounter = draft.newTransfersCounter - amount
      }),
    [loadVersion]: (state, { payload: version }) =>
      produce(state, (draft) => {
        draft.version = version
      }),
    [setModalTab]: (state, { payload: tabName }) =>
      produce(state, (draft) => {
        draft.modalTabToOpen = tabName
      }),
    [setAllTransfersCount]: (state, { payload: transfersCount }) =>
      produce(state, (draft) => {
        draft.allTransfersCount = transfersCount
      }),
    [clearModalTab]: state => produce(state, (draft) => {
      draft.modalTabToOpen = null
    }),
    [lockDmQueue]: state => produce(state, (draft) => {
      draft.directMessageQueueLock = true
    }),
    [unlockDmQueue]: state => produce(state, (draft) => {
      draft.directMessageQueueLock = false
    }),
    [lockMessageQueue]: state => produce(state, (draft) => {
      draft.messageQueueLock = true
    }),
    [unlockMessageQueue]: state => produce(state, (draft) => {
      draft.messageQueueLock = false
    }),
    [setTransfers]: (state, { payload: { id, value } }) =>
      produce(state, (draft) => {
        draft.transfers[id] = value
      })
  },
  initialState
)

export const epics = {
  askForBlockchainLocation,
  proceedWithSyncing,
  restartAndRescan,
  initializeUseTor
}

export default {
  epics,
  actions,
  reducer
}
