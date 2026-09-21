// Optional Internet check after local readiness. Requires appium-ios-device on
// the Mac connected by USB; never logs the Tor exit address or authentication.
const { utilities } = require(process.env.QUIET_IOS_DEVICE_LIBRARY || 'appium-ios-device')
const tls = require('node:tls')
const [udid, port] = process.argv.slice(2)
if (!udid || !port) throw new Error('Usage: node probe-network.cjs DEVICE_UDID HTTP_TUNNEL_PORT')
const host = 'check.torproject.org'

async function probe() {
  const socket = await utilities.connectPort(udid, Number(port))
  let secured
  try {
    await new Promise((resolve, reject) => {
      let buffer = ''
      const timeout = setTimeout(() => finish(new Error('HTTP tunnel CONNECT timed out')), 45_000)
      const finish = error => {
        clearTimeout(timeout)
        socket.off('data', onData)
        socket.off('error', finish)
        socket.off('close', onClose)
        if (error) reject(error)
        else resolve()
      }
      const onClose = () => finish(new Error('HTTP tunnel closed before CONNECT reply'))
      const onData = data => {
        buffer += data.toString()
        if (!buffer.includes('\r\n\r\n')) return
        finish(/^HTTP\/1\.[01] 200/.test(buffer) ? undefined : new Error('HTTP tunnel rejected CONNECT'))
      }
      socket.on('data', onData)
      socket.once('error', finish)
      socket.once('close', onClose)
      socket.resume()
      socket.write(`CONNECT ${host}:443 HTTP/1.1\r\nHost: ${host}:443\r\n\r\n`)
    })
    secured = tls.connect({ socket, servername: host })
    const response = await new Promise((resolve, reject) => {
      let buffer = ''
      const timeout = setTimeout(() => finish(new Error('Tor HTTPS request timed out')), 20_000)
      const finish = error => {
        clearTimeout(timeout)
        if (error) reject(error)
        else resolve(buffer)
      }
      secured.once('error', finish)
      secured.on('data', data => (buffer += data.toString()))
      secured.once('end', () => finish())
      secured.once('secureConnect', () =>
        secured.write(`GET /api/ip HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`)
      )
    })
    if (!/^HTTP\/1\.[01] 200/.test(response) || !/"IsTor"\s*:\s*true/.test(response)) {
      throw new Error('Tor Project did not confirm Tor egress')
    }
    console.log('HTTPS through device HTTP tunnel PASS; IsTor=true')
  } finally {
    secured?.destroy()
    socket.destroy()
  }
}
probe().then(
  () => process.exit(0),
  error => {
    console.error(error.message)
    process.exit(1)
  }
)
