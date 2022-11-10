import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'

import logger from './logger'

import { socketActions, WebsocketConnectionPayload } from './sagas/socket/socket.slice'
import { connection } from '@quiet/state-manager'

const log = logger('renderer')

if (window) {
  window.localStorage.setItem('debug', process.env.DEBUG)
}

ipcRenderer.on('newUpdateAvailable', _event => {
  store.dispatch(updateHandlers.epics.checkForUpdate() as any)
})

ipcRenderer.on('force-save-state', async _event => {
  await persistor.flush()
  ipcRenderer.send('state-saved')
})

ipcRenderer.on('backendInitialized', _event => {
  log('backend initialized')
})

ipcRenderer.on('appRefresh', _event => {
  store.dispatch(connection.actions.setAppRefresh(true) as any)
})

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
