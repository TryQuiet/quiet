import { Web } from './vendor/buttercup'
import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'
import waggleHandlers from './store/handlers/waggle'
import publicChannelsHandlers from './store/handlers/publicChannels'
import directMessagesHandlers from './store/handlers/directMessages'

import { successNotification } from './store/handlers/utils'
import notificationsHandlers from './store/handlers/notifications'
import { socketsActions } from './sagas/socket/socket.saga.reducer'
import debug from 'debug'

const log = Object.assign(debug('zbay:renderer'), {
  error: debug('zbay:renderer:err')
})

if (window) {
  window.localStorage.setItem('debug', process.env.DEBUG)
}

Web.HashingTools.patchCorePBKDF()

ipcRenderer.on('newUpdateAvailable', event => {
  store.dispatch(updateHandlers.epics.checkForUpdate())
})

ipcRenderer.on('successMessage', (event, msg) => {
  store.dispatch(
    notificationsHandlers.actions.enqueueSnackbar(successNotification({ message: msg }))
  )
})

ipcRenderer.on('connectToWebsocket', (event) => {
  log('connecting to websocket')
  store.dispatch(socketsActions.connect())
})

ipcRenderer.on('waggleInitialized', (event) => {
  log('waggle Initialized')
  store.dispatch(waggleHandlers.actions.setIsWaggleConnected(true))
  store.dispatch(publicChannelsHandlers.epics.loadPublicChannels())
  store.dispatch(publicChannelsHandlers.epics.subscribeForPublicChannels())
  store.dispatch(directMessagesHandlers.epics.getPrivateConversations())
  store.dispatch(directMessagesHandlers.epics.subscribeForAllConversations())
})

window.jdenticon_config = {
  lightness: {
    color: [0.31, 0.44],
    grayscale: [0.52, 0.57]
  },
  saturation: {
    color: 0.82,
    grayscale: 0.84
  },
  backColor: '#f3f0f6ff'
}

render(<Root />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
