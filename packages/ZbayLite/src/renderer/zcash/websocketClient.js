import { ipcRenderer } from 'electron'

let counter = 0
var mapping = new Map()
export const sendMessage = async (message, address) => {
  const promise = new Promise((resolve, reject) => {
    mapping.set(counter, {
      resolve: resolve,
      data: JSON.stringify({
        id: counter,
        message: message,
        endpoint: `ws://${address}.onion`
      })
    })
  })
  ipcRenderer.send(
    'sendWebsocket',
    JSON.stringify({
      id: counter,
      message: message,
      endpoint: `ws://${address}.onion`
    })
  )
  counter++
  return promise
}

ipcRenderer.on('sendWebsocket', (e, d) => {
  const data = JSON.parse(d)
  mapping.get(data.id).resolve(data.response)
  mapping.delete(data.id)
})
