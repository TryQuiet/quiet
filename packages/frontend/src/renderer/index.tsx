import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'

import debug from 'debug'

import { initSentry } from '../shared/sentryConfig'

import { socketActions, WebsocketConnectionPayload } from './sagas/socket/socket.slice'

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

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
