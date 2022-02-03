import React from 'react'
import { render } from 'react-dom'
import debug from 'debug'
import { ipcRenderer } from 'electron'
import Root from './Root'
import { socketActions, WebsocketConnectionPayload } from './sagas/socket/socket.slice'
import store from './store'
import updateHandlers from './store/handlers/update'
import waggleHandlers from './store/handlers/waggle'
import { initSentry } from '../../sentryConfig'

initSentry()

const log = Object.assign(debug('frontend:renderer'), {
  error: debug('frontend:renderer:err')
})

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

ipcRenderer.on('waggleInitialized', (_event) => {
  log('waggle initialized')
  store.dispatch(waggleHandlers.actions.setIsWaggleConnected(true))
})

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
