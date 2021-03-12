import { messageType } from '../../shared/static'

import { packMemo } from '../../renderer/zbay/transit'

import electronStore from '../../shared/electronStore'

var WebSocketClient = require('ws')
var HttpsProxyAgent = require('https-proxy-agent')

const messages = require('../../renderer/zbay/index').messages

const connections = new Map()

export const connect = address =>
  new Promise((resolve, reject) => {
    const ports = electronStore.get('ports')
    const identity = electronStore.get('identity')
    try {
      const agent = new HttpsProxyAgent({
        host: 'localhost',
        port: ports.httpTunnelPort
      })
      const socket = new WebSocketClient(address, { agent: agent }, { handshakeTimeout: 80_000 })
      const id = setTimeout(() => {
        // eslint-disable-next-line
        reject('timeout')
      }, 80_000)
      socket.on('unexpected-response', () => {
        console.log('Unexpected response, most likely, the contact youre trying to connect is offline')
      })
      socket.on('open', async function (a) {
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
