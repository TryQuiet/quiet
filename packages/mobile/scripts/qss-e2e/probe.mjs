// Run inside the fixture container, against its own loopback interface.
import assert from 'node:assert/strict'
import { io } from 'socket.io-client'

const socket = io('http://127.0.0.1:3003', {
  transports: ['websocket'],
  reconnection: false,
  timeout: 10000,
})
try {
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve)
    socket.once('connect_error', reject)
  })
  const request = (event, payload) => socket.timeout(15000).emitWithAck(event, {
    ts: Date.now(), status: 'sending', ...(payload ? { payload } : {}),
  })
  const siteKey = await request('get-captcha-site-key')
  assert.equal(siteKey.status, 'success')
  assert.equal(siteKey.payload.siteKey, '10000000-ffff-ffff-ffff-000000000001')
  // Verify the real guard before the connection becomes captcha-authorized.
  const missing = await request('verify-captcha', {})
  assert.equal(missing.status, 'error')
  const valid = await request('verify-captcha', {
    token: '10000000-aaaa-bbbb-cccc-000000000001',
  })
  assert.equal(valid.status, 'success', valid.reason)
  process.stdout.write(JSON.stringify({
    websocket: 'connected', testSiteKey: true, missingTokenRejected: true,
    publicTestTokenVerified: true, productionCaptcha: false,
  }) + '\n')
} finally {
  socket.close()
}
