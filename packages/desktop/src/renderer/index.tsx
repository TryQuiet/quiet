import React from 'react'
import { createRoot, Root as ReactDomRoot } from 'react-dom/client'
import { ipcRenderer } from 'electron'
import Root, { persistor } from './Root'
import store from './store'
import updateHandlers from './store/handlers/update'
import { socketActions } from './sagas/socket/socket.slice'
import { communities } from '@quiet/state-manager'
import { createLogger } from './logger'

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
  const dataPort = new URLSearchParams(window.location.search).get('dataPort')
  if (!dataPort) {
    logger.error('No dataPort found in URL parameters')
    return
  }
  if (!socketIOSecret) {
    logger.error('No socketIOSecret found in IPC event')
    return
  }
  store.dispatch(socketActions.startConnection({ dataPort: parseInt(dataPort), socketIOSecret }))
})

let container: HTMLElement | null = null
let root: ReactDomRoot | null = null
export function renderApp() {
  if (!container) {
    container = document.getElementById('root')
    if (!container) throw new Error('No root html element!')
  }
  if (root) {
    root.unmount()
  }
  root = createRoot(container)
  root.render(<Root />)
}

logger.info('NODE_ENV', process.env.NODE_ENV)
// Only call renderApp if not running in a test environment
if (process.env.NODE_ENV !== 'test') {
  renderApp()
}

// TODO: this is a bit hacky, should be moved into a saga
export const clearCommunity = async (remount: boolean = true) => {
  persistor.pause()
  await persistor.flush()
  await persistor.purge()
  store.dispatch(communities.actions.resetApp('payload'))
  ipcRenderer.send('clear-community')
  if (remount) {
    renderApp()
  }
  persistor.persist()
}

if (module.hot) {
  module.hot.accept()
}
