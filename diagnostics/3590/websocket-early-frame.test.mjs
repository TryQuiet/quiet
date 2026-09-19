import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'

const backendRequire = createRequire(new URL('../../packages/backend/package.json', import.meta.url))
const { WebSocket, WebSocketServer } = backendRequire('ws')
const sourcePath = new URL('../../packages/backend/node_modules/it-ws/dist/src/source.js', import.meta.url)
const sourceRequire = createRequire(await realpath(sourcePath))
let sourceUrl = sourcePath.href

// Experimental control only. Load a private copy with the listener registered
// at construction, keeping the installed dependency and application unchanged.
if (process.env.REPRO_EAGER_WS_SOURCE === 'true') {
  const original = await readFile(sourcePath, 'utf8')
  const lazyStart = '    const source = (async function* () {\n'
  const readStart = '        await connected();'
  assert.equal(original.split(lazyStart).length, 2)
  assert.equal(original.split(readStart).length, 2)
  const eager = original
    .replace(lazyStart, '')
    .replace(readStart, `${lazyStart}${readStart}`)
    .replace("from 'event-iterator'", `from '${pathToFileURL(sourceRequire.resolve('event-iterator')).href}'`)
    .replace(
      "from 'uint8arrays/from-string'",
      `from '${new URL('../../packages/backend/node_modules/uint8arrays/dist/src/from-string.js', import.meta.url).href}'`
    )
  sourceUrl = `data:text/javascript;base64,${Buffer.from(eager).toString('base64')}`
}
const { default: createSource } = await import(sourceUrl)

test('it-ws preserves a nonce frame received before the first source read', { timeout: 5_000 }, async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 })
  await once(server, 'listening')
  const nonce = Buffer.alloc(24, 1)
  const laterFrame = Buffer.alloc(24, 2)
  let remote
  server.once('connection', socket => {
    remote = socket
    socket.send(nonce)
  })

  const client = new WebSocket(`ws://127.0.0.1:${server.address().port}`)
  const source = createSource(client)
  try {
    // Await the real message event, not an arbitrary sleep or mocked transport.
    // This reproduces the scheduling window between WebSocket open and libp2p
    // starting its pnet byte-stream reader.
    const [wireFrame] = await once(client, 'message')
    assert.deepEqual(Buffer.from(wireFrame), nonce)
    console.info('DIAG3590 nonce reached the actual socket before the first source read')
    const next = source.next()
    remote.send(laterFrame)
    const first = await next
    console.info('DIAG3590 first frame returned by it-ws', {
      eager: process.env.REPRO_EAGER_WS_SOURCE === 'true',
      firstByte: first.value?.[0],
      length: first.value?.byteLength,
    })
    assert.deepEqual(
      Buffer.from(first.value),
      nonce,
      'The nonce arrived but it-ws dropped it before attaching its listener'
    )
  } finally {
    const closed = once(client, 'close')
    client.terminate()
    await closed
    await source.return()
    for (const socket of server.clients) socket.terminate()
    await new Promise(resolve => server.close(resolve))
  }
})
