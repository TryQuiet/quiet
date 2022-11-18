import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'

import logger from './logger'

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

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
