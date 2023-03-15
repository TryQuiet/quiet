import React from 'react'
import { createRoot } from 'react-dom/client'
import { ipcRenderer } from 'electron'

import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'
import { communities } from '@quiet/state-manager'
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

ipcRenderer.on('invitation', (_event, invitation) => {
  log('invitation', invitation, 'dispatching action')
  store.dispatch(communities.actions.handleInvitationCode(invitation.code))
})

export const clearCommunity = async () => {
  await persistor.purge()
  persistor.pause()

  ipcRenderer.send('clear-community')
}

const container = document.getElementById('root')
const root = createRoot(container) // createRoot(container!) if you use TypeScript
root.render(<Root />)

if (module.hot) {
  module.hot.accept()
}
