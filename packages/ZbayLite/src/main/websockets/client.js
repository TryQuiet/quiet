import { messageType } from '../../shared/static'

import { packMemo } from '../../renderer/zbay/transit'

import electronStore from '../../shared/electronStore'

var WebSocketClient = require('ws')
var url = require('url')
var HttpsProxyAgent = require('https-proxy-agent')


const messages = require('../../renderer/zbay/index').messages

const connections = new Map()


export const connect = address =>
new Promise((resolve, reject) => {
  const ports = electronStore.get('ports')
  const identity = electronStore.get('identity')
  console.log('trying to establish connection in websocket client')
    let proxy = null
    if (ports !== undefined) {
     proxy = `http://localhost:${ports.httpTunnelPort}`
    } else {
      proxy = 'http://localhost:9082'
    }
    try {
      const options = new url.URL(proxy)
      const agent = new HttpsProxyAgent(options)
      const socket = new WebSocketClient(address, { agent: agent }, { handshakeTimeout: 80_000 })
      const id = setTimeout(() => {
        // eslint-disable-next-line
        reject('timeout')
      }, 80_000)
      socket.on('unexpected-response', err => {
        console.log(err)
      })
      socket.on('open', async function (a) {
        console.log('opened websocket client connection')
        const privKey = identity.signerPrivKey
        const message = messages.createMessage({
          messageData: {
            type: messageType.CONNECTION_ESTABLISHED,
            data: null
          },
          privKey: privKey
        })
        const memo = await packMemo(message, false)
        socket.send(memo)
        socket.on('close', function (a) {
          console.log('disconnected client')
          socket.close()
          connections.delete(address)
        })
        clearTimeout(id)
        connections.set(address, socket)
        resolve(socket)
      })
      socket.on('error', err => {
        reject(new Error('timeout'))
        console.log(err)
      })
    } catch (error) {
      console.log(error)
      reject(new Error('error'))
    }
  })

export const clearConnections = () => {
  for (const socket of connections.values()) {
    try {
      socket.close()
    } catch (err) {
      console.log(err)
    }
  }
}
export const handleSend = async ({ message, endpoint }) => {
  try {
    if (!connections.get(endpoint)) {
      const connection = await connect(endpoint)
      connections.set(endpoint, connection)
      connection.send(message)
    } else {
      connections.get(endpoint).send(message)
    }
    return 1
  } catch (error) {
    return -1
  }
}
export default { handleSend, connect, clearConnections }
