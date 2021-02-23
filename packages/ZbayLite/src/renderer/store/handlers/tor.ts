import { produce, immerable } from 'immer'
import net from 'net'
import { ipcRenderer } from 'electron'

import { createAction, handleActions } from 'redux-actions'
import torSelectors from '../selectors/tor'
import { successNotification } from './utils'
import notificationsHandlers from './notifications'
import electronStore from '../../../shared/electronStore'
import { actionTypes } from '../../../shared/static'

import { ActionsType, PayloadType } from './types'

export const client = new net.Socket()
export const defaultTorUrlProxy = 'localhost:9050'

class Tor {
  url: string
  enabled: boolean
  error?: string
  status: string

  constructor(values?: Partial<Tor>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Tor = {
  ...new Tor({
    url: '',
    enabled: false,
    error: null,
    status: ''
  })
}

const setEnabled = createAction<{ enabled: boolean }>(actionTypes.SET_TOR_ENABLED)
const setUrl = createAction<{ url: string }>(actionTypes.SET_TOR_URL)
const setError = createAction<{ error: string }>(actionTypes.SET_TOR_ERROR)
const setStatus = createAction<{ status: string }>(actionTypes.SET_TOR_STATUS)

export const actions = {
  setUrl,
  setEnabled,
  setError,
  setStatus
}

export type TorActions = ActionsType<typeof actions>

let init = false
const initEvents = () => async dispatch => {
  client.on('error', () => {
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
const checkDeafult = () => async dispatch => {
  if (!init) {
    init = true
    await dispatch(initEvents())
  }
  const url = defaultTorUrlProxy.split(':')

  const checkedUrl = defaultTorUrlProxy
  dispatch(setUrl({ url: checkedUrl }))
  client.connect(Number(url[1]), url[0], () => {
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

  client.connect(Number(url[1]), url[0], () => {
    const msg = Buffer.from('050100', 'hex')
    client.write(msg)
  })
}
export const createZcashNode = torUrl => async dispatch => {
  electronStore.set('torEnabled', !!torUrl)
  let ipAddress
  if (torUrl?.startsWith('localhost')) {
    ipAddress = torUrl.replace('localhost', '127.0.0.1')
  } else {
    ipAddress = torUrl
  }
  ipcRenderer.send('create-node', ipAddress)
  if (torUrl) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        successNotification({ message: 'You are using Tor proxy.' })
      )
    )
  }
}
export const epics = {
  checkTor,
  createZcashNode,
  checkDeafult
}

export const reducer = handleActions<Tor, PayloadType<TorActions>>(
  {
    [setEnabled.toString()]: (state, { payload: { enabled } }: TorActions['setEnabled']) =>
      produce(state, draft => {
        if (enabled) {
          draft.enabled = enabled
          draft.status = 'down'
        } else {
          draft.enabled = enabled
          draft.status = 'down'
          draft.error = ''
          draft.url = ''
        }
      }),
    [setUrl.toString()]: (state, { payload: { url } }: TorActions['setUrl']) =>
      produce(state, draft => {
        draft.url = url
        draft.status = 'down'
      }),
    [setError.toString()]: (state, { payload: { error } }: TorActions['setError']) =>
      produce(state, draft => {
        draft.error = error
      }),
    [setStatus.toString()]: (state, { payload: { status } }: TorActions['setStatus']) =>
      produce(state, draft => {
        draft.status = status
      })
  },
  initialState
)
export default {
  actions,
  epics,
  reducer
}
