import Immutable from 'immutable'
import net from 'net'
import { ipcRenderer } from 'electron'

import { createAction, handleActions } from 'redux-actions'
import torSelectors from '../selectors/tor'
import { successNotification } from './utils'
import notificationsHandlers from './notifications'
import electronStore from '../../../shared/electronStore'
import { actionTypes } from '../../../shared/static'
import logsHandlers from '../handlers/logs'

export const client = new net.Socket()
export const defaultTorUrlProxy = 'localhost:9050'

export const Tor = Immutable.Record(
  {
    url: '',
    enabled: false,
    error: null,
    status: ''
  },
  'Tor'
)
export const initialState = Tor()

const setEnabled = createAction(actionTypes.SET_TOR_ENABLED)
const setUrl = createAction(actionTypes.SET_TOR_URL)
const setError = createAction(actionTypes.SET_TOR_ERROR)
const setStatus = createAction(actionTypes.SET_TOR_STATUS)

export const actions = {
  setUrl,
  setEnabled,
  setError,
  setStatus
}
let init = false
const initEvents = () => async (dispatch, getState) => {
  client.on('error', data => {
    client.destroy()
    dispatch(setStatus({ status: 'down' }))
    dispatch(setError({ error: 'Cannot establish a connection' }))
  })
  client.on('data', data => {
    client.destroy()
    if (Buffer.from(data).toString('hex') === '0500') {
      dispatch(setStatus({ status: 'stable' }))
      dispatch(setError({ error: '' }))
    }
  })
}
const checkDeafult = () => async (dispatch, getState) => {
  if (init === false) {
    init = true
    await dispatch(initEvents())
  }
  const url = defaultTorUrlProxy.split(':')

  let checkedUrl = defaultTorUrlProxy
  dispatch(setUrl({ url: checkedUrl }))
  client.connect(url[1], url[0], () => {
    const msg = Buffer.from('050100', 'hex')
    client.write(msg)
  })
}

const checkTor = () => async (dispatch, getState) => {
  const tor = torSelectors.tor(getState())
  const url = tor.url.split(':')
  dispatch(setStatus({ status: 'loading' }))
  setTimeout(() => {
    if (torSelectors.tor(getState()).status === 'loading') {
      dispatch(setStatus({ status: 'down' }))
      dispatch(setError({ error: 'Timeout error' }))
    }
  }, 5000)

  client.connect(url[1], url[0], () => {
    const msg = Buffer.from('050100', 'hex')
    client.write(msg)
  })
}
export const createZcashNode = torUrl => async (dispatch, getState) => {
  electronStore.set('torEnabled', !!torUrl)
  if (torUrl) {
    dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Adding tor url: ${torUrl}` }))
  }
  let ipAddress
  if (torUrl && torUrl.startsWith('localhost')) {
    ipAddress = torUrl.replace('localhost', '127.0.0.1')
  } else {
    ipAddress = torUrl
  }
  ipcRenderer.send('create-node', ipAddress)
  if (torUrl) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({ message: `You are using Tor proxy.` })
      )
    )
  }
}
export const epics = {
  checkTor,
  createZcashNode,
  checkDeafult
}

export const reducer = handleActions(
  {
    [setEnabled]: (state, { payload: { enabled } }) => {
      if (enabled) {
        return state.set('enabled', enabled).set('status', 'down')
      } else {
        return state
          .set('enabled', enabled)
          .set('status', 'down')
          .set('url', '')
          .set('error', '')
      }
    },
    [setUrl]: (state, { payload: { url } }) =>
      state.set('url', url).set('status', 'down'),
    [setError]: (state, { payload: { error } }) => state.set('error', error),
    [setStatus]: (state, { payload: { status } }) => state.set('status', status)
  },
  initialState
)
export default {
  actions,
  epics,
  reducer
}
