import Immutable from 'immutable'
import net from 'net'
import { ipcRenderer } from 'electron'

import { createAction, handleActions } from 'redux-actions'
import torSelectors from '../selectors/tor'
import { successNotification } from './utils'
import notificationsHandlers from './notifications'
import electronStore from '../../../shared/electronStore'

export const client = new net.Socket()
export const defaultTorUrlProxy = 'localhost:9050'
export const defaultTorUrlBrowser = 'localhost:9150'

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

const setEnabled = createAction('SET_TOR_ENABLED')
const setUrl = createAction('SET_TOR_URL')
const setError = createAction('SET_TOR_ERROR')
const setStatus = createAction('SET_TOR_STATUS')

export const actions = {
  setUrl,
  setEnabled,
  setError,
  setStatus
}

const checkDeafult = () => async (dispatch, getState) => {
  const url = defaultTorUrlProxy.split(':')
  const url2 = defaultTorUrlBrowser.split(':')
  let checkedUrl
  try {
    checkedUrl = defaultTorUrlProxy
    client.connect(
      url[1],
      url[0],
      () => {
        const msg = Buffer.from('050100', 'hex')
        client.write(msg)
      }
    )
  } catch (err) {
    checkedUrl = defaultTorUrlBrowser
    client.connect(
      url2[1],
      url2[0],
      () => {
        const msg = Buffer.from('050100', 'hex')
        client.write(msg)
      }
    )
  }
  client.on('data', data => {
    client.destroy() // kill client after server's response
    if (Buffer.from(data).toString('hex') === '0500') {
      dispatch(setUrl({ url: checkedUrl }))
      dispatch(setStatus({ status: 'stable' }))
      dispatch(setError({ error: '' }))
    } else {
    }
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
  try {
    client.connect(
      url[1],
      url[0],
      () => {
        const msg = Buffer.from('050100', 'hex')
        client.write(msg)
      }
    )
  } catch (err) {
    dispatch(setStatus({ status: 'down' }))
    dispatch(setError({ error: err.message }))
  }
  client.on('error', () => {
    dispatch(setStatus({ status: 'down' }))
    dispatch(setError({ error: 'Can not establish a connection' }))
  })
  client.on('data', data => {
    client.destroy() // kill client after server's response
    if (Buffer.from(data).toString('hex') === '0500') {
      dispatch(setStatus({ status: 'stable' }))
      dispatch(setError({ error: '' }))
    } else {
      dispatch(setStatus({ status: 'down' }))
      dispatch(setError({ error: 'Can not establish a connection' }))
    }
  })
}
export const createZcashNode = torUrl => async (dispatch, getState) => {
  electronStore.set('torEnabled', !!torUrl)
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
    [setUrl]: (state, { payload: { url } }) => state.set('url', url).set('status', 'down'),
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
