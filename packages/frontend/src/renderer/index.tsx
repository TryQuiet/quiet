import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'
import waggleHandlers from './store/handlers/waggle'

import logger from '../logger'

import { initSentry } from '../shared/sentryConfig'

import { socketActions, WebsocketConnectionPayload } from './sagas/socket/socket.slice'

initSentry()

const log = logger('renderer')

if (window) {
  window.localStorage.setItem('debug', process.env.DEBUG)
}

ipcRenderer.send('start-waggle')

ipcRenderer.on('newUpdateAvailable', (_event) => {
  store.dispatch(updateHandlers.epics.checkForUpdate() as any)
})

ipcRenderer.on('connectToWebsocket', (_event, payload: WebsocketConnectionPayload) => {
  store.dispatch(socketActions.startConnection(payload))
})

ipcRenderer.on('force-save-state', async (_event) => {
  await persistor.flush()
  ipcRenderer.send('state-saved')
})

ipcRenderer.on('waggleInitialized', (_event) => {
  log('waggle initialized')
  store.dispatch(waggleHandlers.actions.setIsWaggleConnected(true))
})

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
