import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'

import logger from './logger'

import localStorage from 'localforage'
import { network } from '@quiet/state-manager'

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

ipcRenderer.on('clearLocalStorageNetwork', async (_event) => {
  await localStorage.setItem('networkInitializedCommunities', new Set())
  await localStorage.setItem('networkConnectedPeers', new Set())
})

ipcRenderer.on('appRefresh', async (_event) => {
  const initializedCommunities: Set<string> = await localStorage.getItem('networkInitializedCommunities')
  const connectedPeers: Set<string> = await localStorage.getItem('networkConnectedPeers')

  for (const name of Array.from(initializedCommunities)) {
    store.dispatch(network.actions.addInitializedCommunity(name))
  }
  for (const name of Array.from(connectedPeers)) {
    store.dispatch(network.actions.addConnectedPeer(name))
  }
})

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
