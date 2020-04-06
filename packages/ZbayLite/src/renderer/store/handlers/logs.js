import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import { ipcRenderer } from 'electron'
import { actionTypes } from '../../../shared/static'

export const Logs = Immutable.Record(
  {
    transactionLogs: [],
    applicationLogs: [],
    nodeLogs: [],
    islogsFileLoaded: false,
    isLogWindowOpened: false
  },
  'logs'
)

export const initialState = Logs()

const setTransactionLogs = createAction(actionTypes.SET_TRANSACTIONS_LOGS)
const setApplicationLogs = createAction(actionTypes.SET_APPLICATIONS_LOGS)
const setNodeLogs = createAction(actionTypes.SET_NODE_LOGS)
const setLogWindowOpened = createAction(actionTypes.SET_LOG_WINDOW_OPENED)

const loadTargetLogs = () => async (dispatch, getState) => {
  ipcRenderer.send('load-logs')
  dispatch(setLogWindowOpened(true))
}

const closeLogsWindow = () => async (dispatch, getState) => {
  ipcRenderer.send('disable-load-logs')
  dispatch(setLogWindowOpened(false))
}

const saveLogs = (data) => async (dispatch, getState) => {
  ipcRenderer.send('save-to-log-file', data)
}

export const actions = {
  setTransactionLogs,
  setApplicationLogs,
  setNodeLogs,
  setLogWindowOpened
}

export const epics = {
  loadTargetLogs,
  closeLogsWindow,
  saveLogs
}

export const reducer = handleActions(
  {
    [setTransactionLogs]: (state, { payload: transactionLogs }) => state.setIn(['transactionLogs'], transactionLogs),
    [setApplicationLogs]: (state, { payload: ApplicationLogs }) => state.setIn(['applicationLogs'], ApplicationLogs),
    [setNodeLogs]: (state, { payload: setNodeLogs }) => state.setIn(['nodeLogs'], setNodeLogs),
    [setLogWindowOpened]: (state, { payload: logPanelStatus }) => state.setIn(['isLogWindowOpened'], logPanelStatus)
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
