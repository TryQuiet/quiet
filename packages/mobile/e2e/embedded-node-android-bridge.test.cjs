// Tests the real fixture's protocol correlation. Android JNI execution is a
// separate acceptance test; this host test supplies messages, never a verdict.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const { test } = require('node:test')
const vm = require('node:vm')

const fixture = path.join(__dirname, 'fixtures/embedded-node-database-android.cjs')
const context = {
  require: createRequire(fixture), module: { exports: {} },
  setTimeout, clearTimeout, console, process,
}
vm.runInNewContext(fs.readFileSync(fixture, 'utf8') + '\nmodule.exports = bridgeRoundTrip', context)
const bridgeRoundTrip = context.module.exports

function bridgeFor(deliver) {
  let callback
  return {
    registerChannel(channel, listener) {
      assert.equal(channel, '_EVENTS_')
      callback = listener
    },
    sendMessage(channel, text) {
      assert.equal(channel, '_EVENTS_')
      const envelope = JSON.parse(text)
      assert.equal(envelope.event, 'message')
      const [event, nonce] = JSON.parse(envelope.payload)
      assert.equal(event, 'readyForSecret')
      assert.match(nonce, /^public-run-[a-f0-9]{32}$/)
      queueMicrotask(() => deliver(message => callback('_EVENTS_', JSON.stringify(message)), nonce))
    },
  }
}

const response = nonce => ({ event: 'secret', payload: { type: 'set-socket-secret', nonce } })

test('waits for its exact nonce on a shared channel and ignores messages after settlement', async () => {
  const stages = []
  const bridge = bridgeFor((emit, nonce) => {
    emit({ event: 'shutdown', payload: '[]' })
    emit(response('another-request'))
    emit(response(nonce))
    emit({ event: 'unrelated-late-event' })
  })
  await bridgeRoundTrip(bridge, 'public-run', stage => stages.push(stage))
  assert.equal(stages.filter(stage => stage === 'bridge-awaiting-matching-response').length, 2)
  assert.equal(stages.at(-1), 'bridge-response-payload-type')
})

test('rejects a malformed response even when its nonce matches', async () => {
  const bridge = bridgeFor((emit, nonce) => emit({ event: 'secret', payload: { type: 'wrong-type', nonce } }))
  await assert.rejects(bridgeRoundTrip(bridge, 'public-run', () => {}), { code: 'ERR_ASSERTION' })
})

test('unrelated messages cannot pass the test or run without a bound', async () => {
  const bridge = bridgeFor((emit, nonce) => {
    for (let index = 0; index < 65; index++) emit(response('wrong-' + index))
    emit(response(nonce))
  })
  await assert.rejects(bridgeRoundTrip(bridge, 'public-run', () => {}), { code: 'ERR_ASSERTION' })
})
