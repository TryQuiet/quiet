var WebSocketClient = require('ws')
var url = require('url')
var HttpsProxyAgent = require('https-proxy-agent')
var proxy = 'http://localhost:9082'

import { messageType } from '../../shared/static'

import { packMemo } from '../../renderer/zbay/transit'

import electronStore from '../../shared/electronStore'

const identity = electronStore.get('identity')

var messages = require('../../renderer/zbay/index').messages

const connections = new Map()

export const connect = address =>
  new Promise((resolve, reject) => {
    try {
      const options = url.parse(proxy)
      const agent = new HttpsProxyAgent(options)
      const socket = new WebSocketClient(address, { agent: agent }, { handshakeTimeout: 30000 })
      const id = setTimeout(() => {
        // eslint-disable-next-line
        reject('timeout')
      }, 20000)
      socket.on('unexpected-response', err => {
        console.log(err)
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
          console.log('disconnected client')
          socket.close()
          connections.delete(address)
        })
        clearTimeout(id)
        resolve(socket)
      })
      socket.on('error', err => {
        reject('timeout')
        console.log(err)
      })
    } catch (error) {
      console.log(error)
      reject(new Error('error'))
    }
  })
export const clearConnections = () => {
  connections.forEach((_, value) => {
    try {
      value.close()
    } catch (error) {
      console.error('Failed to close socket')
    }
  })
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
