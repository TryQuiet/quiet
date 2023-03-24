import React from 'react'
import { createRoot } from 'react-dom/client'
import { ipcRenderer } from 'electron'

import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'

import logger from './logger'
import { communities } from '@quiet/state-manager'

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

const container = document.getElementById('root')
let root = createRoot(container) // createRoot(container!) if you use TypeScript
root.render(<Root />)

export const clearCommunity = async () => {
  persistor.pause()
  await persistor.flush()
  await persistor.purge()
  store.dispatch(communities.actions.resetApp('payload'))
  ipcRenderer.send('clear-community')
  root.unmount()
  root = createRoot(container)
  root.render(<Root />)
  persistor.persist()
}

if (module.hot) {
  module.hot.accept()
}
