import { Web } from './vendor/buttercup'
import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import nodeHandlers from './store/handlers/node'
import updateHandlers from './store/handlers/update'
import invitationHandlers from './store/handlers/invitation'
import importChannelHandlers from './store/handlers/importedChannel'
import coordinatorHandlers from './store/handlers/coordinator'
import nodeSelectors from './store/selectors/node'
import coordinatorSelectors from './store/selectors/coordinator'
import { errorNotification, successNotification } from './store/handlers/utils'

import notificationsHandlers from './store/handlers/notifications'

Web.HashingTools.patchCorePBKDF()

ipcRenderer.on('bootstrappingNode', (event, { bootstrapping, message }) => {
  store.dispatch(nodeHandlers.actions.setBootstrapping(bootstrapping))
  store.dispatch(nodeHandlers.actions.setBootstrappingMessage(message))
})

ipcRenderer.on('newUpdateAvailable', event => {
  store.dispatch(updateHandlers.epics.checkForUpdate())
})

ipcRenderer.on('checkDiskSpace', (event, msg) => {
  store.dispatch(notificationsHandlers.actions.enqueueSnackbar(errorNotification({ message: msg })))
})
ipcRenderer.on('successMessage', (event, msg) => {
  store.dispatch(
    notificationsHandlers.actions.enqueueSnackbar(successNotification({ message: msg }))
  )
})

ipcRenderer.on('newInvitation', (event, { invitation }) => {
  if (nodeSelectors.status(store.getState()) === 'healthy') {
    store.dispatch(invitationHandlers.epics.handleInvitation(invitation))
  } else {
    store.dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: `Please wait for full node sync before opening invitation` })
      )
    )
  }
})
ipcRenderer.on('toggleCoordinator', () => {
  if (coordinatorSelectors.running(store.getState()) === true) {
    store.dispatch(coordinatorHandlers.actions.stopCoordinator())
    console.log('coordinator stopped')
  } else {
    store.dispatch(coordinatorHandlers.actions.startCoordinator())
    console.log('coordinator started')
  }
})

ipcRenderer.on('newChannel', (event, { channelParams }) => {
  if (nodeSelectors.status(store.getState()) === 'healthy') {
    store.dispatch(
      importChannelHandlers.epics.decodeChannel(
        `https://zbay.rumblefish.dev/importchannel=${channelParams}`
      )
    )
  } else {
    store.dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: `Please wait for full node sync before importing channel` })
      )
    )
  }
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

module.hot.accept()
