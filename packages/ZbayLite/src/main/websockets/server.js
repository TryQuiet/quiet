var WebSocket = require('ws')

export const createServer = mainWindow => {
  const wsServer = new WebSocket.Server({
    port: 3435,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: true
  })
  wsServer.on('connection', function (socket) {
    console.log('New incoming connection')
    socket.on('message', function (message) {
      if (mainWindow) {
        mainWindow.webContents.send('wsMessage', message)
      }
    })
    socket.on('close', function (message) {
      console.log('disconnected server')
      socket.close()
    })
  })
  console.log('websocket server running')
}
