import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'
import waggleHandlers from './store/handlers/waggle'

import debug from 'debug'

import { socketActions } from './sagas/socket/socket.slice'

const log = Object.assign(debug('zbay:renderer'), {
  error: debug('zbay:renderer:err')
})

if (window) {
  window.localStorage.setItem('debug', process.env.DEBUG)
}

ipcRenderer.on('newUpdateAvailable', (_event) => {
  store.dispatch(updateHandlers.epics.checkForUpdate() as any)
})

ipcRenderer.on('connectToWebsocket', (_event) => {
  store.dispatch(socketActions.startConnection)
})

ipcRenderer.on('waggleInitialized', (_event) => {
  log('waggle Initialized')
  store.dispatch(waggleHandlers.actions.setIsWaggleConnected(true))
})

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
