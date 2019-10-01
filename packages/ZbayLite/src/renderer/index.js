import { Web } from './vendor/buttercup'
import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import nodeHandlers from './store/handlers/node'
// import channelHandlers from './store/handlers/channel'
// import vaultSelectors from './store/selectors/vault'

Web.HashingTools.patchCorePBKDF()

ipcRenderer.on('bootstrappingNode', (event, { bootstrapping, message }) => {
  store.dispatch(nodeHandlers.actions.setBootstrapping(bootstrapping))
  store.dispatch(nodeHandlers.actions.setBootstrappingMessage(message))
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
// remote.app.on('browser-window-focus', () => {
//   const vaultUnlocked = !vaultSelectors.locked(store.getState())
//   if (vaultUnlocked) {
//     store.dispatch(channelHandlers.epics.updateLastSeen())
//     store.dispatch(channelHandlers.epics.clearNewMessages())
//   }
// })

render(<Root />, document.getElementById('root'))

module.hot.accept()
