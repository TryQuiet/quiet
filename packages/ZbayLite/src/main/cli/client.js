import { Worker } from 'worker_threads'
const worker = new Worker('./src/main/cli/worker.js')

export default class Client {
  sync = async () => {
    return postMessage('sync', '')
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
  getNewShieldedAdress = async () => {
    return postMessage('getNewShieldedAdress', '')
  }
  getNewTransparentAdress = async () => {
    return postMessage('getNewTransparentAdress', '')
  }
}
let counter = 0
var mapping = new Map()
// worker.postMessage()
const postMessage = async (msgType, data = '') => {
  const promise = new Promise((resolve, reject) => {
    mapping.set(counter, {
      resolve: resolve,
      data: JSON.stringify({ id: counter, method: msgType, args: data })
    })
  })
  worker.postMessage(
    JSON.stringify({ id: counter, method: msgType, args: data })
  )
  counter++
  return promise
}

worker.on('message', d => {
  const data = JSON.parse(d)
  mapping.get(data.id).resolve(data.data)
  mapping.delete(data.id)
})
