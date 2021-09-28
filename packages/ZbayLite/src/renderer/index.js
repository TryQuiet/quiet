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

import { publicChannels, identity } from '@zbayapp/nectar'

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
  console.log('connectToWebsocket')
  store.dispatch(socketsActions.connect())
})

const ZbayChannel = {
  name: 'zbay',
  description: 'zbay marketplace channel',
  owner: '030fdc016427a6e41ca8dccaf0c09cfbf002e5916a13ee16f5fe7240d0dfe50ede',
  timestamp: 1587009699,
  address: 'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00',
  keys: { ivk: 'zxviews1qvzslllpqcqqpq8z3uyzunfm57xqlpysl5es4nm7eve5y4kkm6p7rhh6xdr27kxsql4dkk0qcad6cm7hxzclq4kzd8ukandz9p8edyw75jvqlxenvwa6ydzlqzch4wt3kdf2vma9gg25qjgc7fxn7pth0qf68ljww6qe379p4xun4za7mgk2qgzkpxlj9wu4ukyta8rfk348v78wn4zrhx2889d3mkj9yhmr0ua95jwv4ln8pyjv0ps5mw78kvadwl6ajxyn6dp2ahgvaau3x' }
}

ipcRenderer.on('waggleInitialized', (event) => {
  log('waggle Initialized')
  store.dispatch(waggleHandlers.actions.setIsWaggleConnected(true))
  // TODO: Refactor when adding communities
  store.dispatch(publicChannels.actions.subscribeForTopic(ZbayChannel))
  store.dispatch(identity.actions.requestPeerId())
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
