// Diagnostic app control only: use existing live instances, never test fixtures.
'use strict'
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const {randomUUID} = require('node:crypto')
exports.run = async (bundle, config) => {
  fs.mkdirSync(config.output, {recursive: true})
  const stores = [...(bundle.profiler.liveInstances?.get('ChannelStore') || [])]
  const live = stores.filter(s => s.channelData?.name === 'general' && !s.closing && s.store)
  assert.equal(live.length, 1, 'must find exactly one existing live general channel')
  const store = live[0]
  if (config.sendPrefix) {
    assert.match(config.sendPrefix, /^qss-smoke-[a-zA-Z0-9_-]+$/)
    assert.ok(Number.isInteger(config.sendCount) && config.sendCount >= 1 && config.sendCount <= 5)
  }
  const sodium = bundle.webpack('../../3rd-party/auth/node_modules/.pnpm/libsodium-wrappers-sumo@0.7.13/node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js')
  await sodium.ready
  const crypto = require('node:crypto'), originalCreate = crypto.createPrivateKey
  let nativeCalls = 0
  crypto.createPrivateKey = function (...args) { nativeCalls++; return originalCreate.apply(this, args) }
  try { sodium.crypto_scalarmult_base(new Uint8Array(32).fill(7)) }
  finally { crypto.createPrivateKey = originalCreate }
  assert.equal(nativeCalls, 1, 'actual app must have installed native adapter automatically')
  const sent = []
  if (config.sendPrefix) {
    const chain = store.auth.getActiveChain()
    for (let n = 1; n <= config.sendCount; n++) {
      const message = {id: randomUUID(), userId: chain.user.userId, type: 1, channelId: store.channelData.id,
        createdAt: Math.floor(Date.now() / 1000), message: config.sendPrefix + '-' + n}
      const start = Date.now()
      assert.equal(await store.sendMessage(message), true)
      sent.push({id: message.id, marker: message.message, sentAt: new Date().toISOString(), localSendMs: Date.now() - start})
    }
  }
  const all = await store.getEntries()
  const messages = all.filter(m => m.message?.startsWith('qss-smoke-')).map(m => ({id: m.id, marker: m.message, verified: m.verified, createdAt: m.createdAt}))
  assert.ok(messages.every(m => m.verified === true))
  fs.writeFileSync(path.join(config.output, 'result.json'), JSON.stringify({utc: new Date().toISOString(), observation: 'live backend only; rendering not observed', pid: process.pid, nativeCallsForPublicDerivation: nativeCalls, sent, totalMessages: all.length, messages}))
}
