var WebSocketClient = require('ws')
var HttpsProxyAgent = require('https-proxy-agent')
var url = require('url')

async function main() {
  //const address = 'ws://skthmrwbdqesj3ukkt5j3vm3w3aoxfcspx7bumc7jtih63mryksbegyd.onion'
  const address = 'ws://neglu5guviogfycw5gjngxlltew46dclhmuiiilvc657h6gzd22n7xyd.onion'
  const proxy = 'http://localhost:9082'
  const options = url.parse(proxy)

  console.log(`address ${address}`)
  console.log(options)
  console.log(new URL(proxy))
  const agent = new HttpsProxyAgent({ host: 'localhost', port: 9082, path: '/'})
  const socket = new WebSocketClient(address, { agent: agent }, { handshakeTimeout: 80_000 })
  socket.on('error', (err, ...args) => {
    console.log('a', typeof err, args)
  })
  socket.on('open', async function (a) {
    console.log('opaspodjaq')
  })
}

main()
