import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'
import waggleHandlers from './store/handlers/waggle'

import debug from 'debug'

import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'

import { socketActions } from './sagas/socket/socket.slice'

if (process.env.REACT_APP_ENABLE_SENTRY === '1') {
  Sentry.init({
    dsn: 'https://1ca88607c3d14e15b36cb2cfd5f16d68@o1060867.ingest.sentry.io/6050774',
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0
  })
}

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
