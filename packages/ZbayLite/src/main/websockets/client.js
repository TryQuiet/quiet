var WebSocketClient = require('ws')
var url = require('url')
var HttpsProxyAgent = require('https-proxy-agent')
var proxy = 'http://localhost:9082'

const connections = new Map()

export const connect = address =>
  new Promise((resolve, reject) => {
    try {
      const options = url.parse(proxy)
      const agent = new HttpsProxyAgent(options)
      const socket = new WebSocketClient(address, { agent: agent })
      const id = setTimeout(() => {
        // eslint-disable-next-line
        reject('timeout')
      }, 20000)
      socket.on('unexpected-response', err => {
        console.log(err)
      })
      socket.on('open', function (a) {
        console.log('connected')
        socket.on('close', function (a) {
          console.log('disconnected')
          socket.close()
          connections.delete(address)
        })
        clearTimeout(id)
        resolve(socket)
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
