import { Web } from './vendor/buttercup'
import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import nodeHandlers from './store/handlers/node'
import appHandlers from './store/handlers/app'
import updateHandlers from './store/handlers/update'
import invitationHandlers from './store/handlers/invitation'
import importChannelHandlers from './store/handlers/importedChannel'
import coordinatorHandlers from './store/handlers/coordinator'
import nodeSelectors from './store/selectors/node'
import coordinatorSelectors from './store/selectors/coordinator'
import logsHandlers from './store/handlers/logs'
import logsSelctors from './store/selectors/logs'
import { errorNotification, successNotification } from './store/handlers/utils'

import notificationsHandlers from './store/handlers/notifications'

Web.HashingTools.patchCorePBKDF()

ipcRenderer.on('bootstrappingNode', (event, { bootstrapping, message }) => {
  store.dispatch(nodeHandlers.actions.setBootstrapping(bootstrapping))
  store.dispatch(nodeHandlers.actions.setBootstrappingMessage(message))
})

ipcRenderer.on('fetchingStatus', (event, { sizeLeft, part, status, speed, eta, rescannedBlock, isFetching }) => {
  if (sizeLeft) {
    store.dispatch(nodeHandlers.actions.setFetchingSizeLeft(sizeLeft))
  }
  if (part) {
    store.dispatch(nodeHandlers.actions.setFetchingPart(part))
  }
  if (status) {
    store.dispatch(nodeHandlers.actions.setFetchingStatus(status))
  }
  if (speed) {
    store.dispatch(nodeHandlers.actions.setFetchingSpeed(speed))
  }
  if (eta) {
    store.dispatch(nodeHandlers.actions.setFetchingEndTime(eta))
  }
  if (rescannedBlock) {
    store.dispatch(nodeHandlers.actions.setRescanningProgress(rescannedBlock))
  }
  if (isFetching === 'IN_PROGRESS') {
    store.dispatch(nodeHandlers.actions.setConnectionStatus(true))
  }
  if (isFetching === 'INTERRUPTED') {
    store.dispatch(nodeHandlers.actions.setConnectionStatus(false))
  }
})

ipcRenderer.on('newUpdateAvailable', event => {
  store.dispatch(updateHandlers.epics.checkForUpdate())
})

ipcRenderer.on('askForUsingDefaultBlockchainLocation', event => {
  store.dispatch(appHandlers.epics.askForBlockchainLocation())
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

ipcRenderer.on('openLogs', () => {
  if (logsSelctors.isLogWindowOpened(store.getState()) === false) {
    store.dispatch(logsHandlers.actions.setLogWindowOpened(true))
    ipcRenderer.send('load-logs')
  } else {
    store.dispatch(logsHandlers.actions.setLogWindowOpened(false))
    ipcRenderer.send('disable-load-logs')
  }
})

ipcRenderer.on('load-logs-to-store', (event, { transactions, debug, applicationLogs }) => {
  store.dispatch(logsHandlers.actions.setNodeLogs(debug))
  store.dispatch(logsHandlers.actions.setTransactionLogs(transactions))
  store.dispatch(logsHandlers.actions.setApplicationLogs(applicationLogs))
})

ipcRenderer.on('checkNodeStatus', (event, { status }) => {
  store.dispatch(nodeHandlers.epics.checkNodeStatus(status))
})

ipcRenderer.on('newChannel', (event, { channelParams }) => {
  if (nodeSelectors.status(store.getState()) === 'healthy') {
    store.dispatch(
      importChannelHandlers.epics.decodeChannel(
        `${channelParams}`
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
