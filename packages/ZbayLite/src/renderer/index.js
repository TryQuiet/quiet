import { Web } from './vendor/buttercup'
import React from 'react'
import { render } from 'react-dom'
import { ipcRenderer } from 'electron'

import Root from './Root'
import store from './store'
import nodeHandlers from './store/handlers/node'
import updateHandlers from './store/handlers/update'

Web.HashingTools.patchCorePBKDF()

ipcRenderer.on('bootstrappingNode', (event, { bootstrapping, message }) => {
  store.dispatch(nodeHandlers.actions.setBootstrapping(bootstrapping))
  store.dispatch(nodeHandlers.actions.setBootstrappingMessage(message))
})

ipcRenderer.on('newUpdateAvailable', (event) => {
  store.dispatch(updateHandlers.epics.checkForUpdate())
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
