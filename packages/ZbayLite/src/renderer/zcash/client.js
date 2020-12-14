import { ipcRenderer } from 'electron'

export default class Client {
  sync = async () => {
    return postMessage('sync', '')
  }
  seed = async () => {
    return postMessage('seed', '')
  }
  shield = async (address = '') => {
    return postMessage('shield', address)
  }
  rescan = async () => {
    return postMessage('rescan', '')
  }
  syncStatus = async () => {
    return postMessage('syncStatus', '')
  }
  info = async () => {
    return postMessage('info', '')
  }
  balance = async () => {
    return postMessage('balance', '')
  }
  notes = async () => {
    return postMessage('notes', '')
  }
  sendTransaction = async (txns = []) => {
    // TODO add validation of payload
    return postMessage('sendTransaction', txns)
  }
  list = async (includeMemoHex = 'yes') => {
    return postMessage('list', `${includeMemoHex}`)
  }
  height = async () => {
    return postMessage('height', '')
  }
  quit = async () => {
    return postMessage('quit', '')
  }
  save = async () => {
    return postMessage('save', '')
  }
  addresses = async () => {
    return postMessage('addresses', '')
  }
  getPrivKey = async address => {
    return postMessage('getPrivKey', address)
  }
  getViewingKey = async address => {
    return postMessage('getViewingKey', address)
  }
  getNewShieldedAdress = async () => {
    return postMessage('getNewShieldedAdress', '')
  }
  getNewTransparentAdress = async () => {
    return postMessage('getNewTransparentAdress', '')
  }
  importKey = async (key, birthday = 740000, rescan = 'norescan') => {
    return postMessage('importKey', { key, birthday, rescan })
  }
}
let counter = 0
var mapping = new Map()
var handlerSet = false
const postMessage = async (method, args = '') => {
  if (!handlerSet) {
    ipcRenderer.on('rpcQuery', (e, d) => {
      const data = JSON.parse(d)
      mapping.get(data.id).resolve(data.data)
      mapping.delete(data.id)
    })
    handlerSet = true
  }
  const promise = new Promise((resolve, reject) => {
    mapping.set(counter, {
      resolve: resolve,
      data: JSON.stringify({ id: counter, method: method, args: args })
    })
  })
  ipcRenderer.send(
    'rpcQuery',
    JSON.stringify({ id: counter, method: method, args: args })
  )
  counter++
  return promise
}

