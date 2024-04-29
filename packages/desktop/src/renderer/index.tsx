import React from 'react'
import { createRoot } from 'react-dom/client'
import { ipcRenderer } from 'electron'
import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'
import { communities, connection } from '@quiet/state-manager'
import createLogger from './logger'

const logger = createLogger('index')

if (window && process.env.DEBUG) {
  window.localStorage.setItem('debug', process.env.DEBUG)
}

ipcRenderer.on('newUpdateAvailable', _event => {
  store.dispatch(updateHandlers.epics.openUpdateModal() as any)
})

ipcRenderer.on('force-save-state', async _event => {
  await persistor.flush()
  ipcRenderer.send('state-saved')
})

ipcRenderer.on('invitation', (_event, invitation: { code: string | string[] }) => {
  if (!invitation.code || !invitation.code.length) return

  let invitationData: string[]
  if (typeof invitation.code === 'string') {
    invitationData = [invitation.code]
  } else {
    invitationData = invitation.code
  }
  store.dispatch(communities.actions.customProtocol(invitationData))
})

ipcRenderer.on('socketIOSecret', (_event, socketIOSecret) => {
  store.dispatch(connection.actions.setSocketIOSecret(socketIOSecret))
})

const container = document.getElementById('root')
if (!container) throw new Error('No root html element!')
let root = createRoot(container)
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
