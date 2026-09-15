'use strict'
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const {performance} = require('node:perf_hooks')
const immediate = () => new Promise(resolve => setImmediate(resolve))
const quietLogger = Object.fromEntries(['trace', 'debug', 'info', 'warn', 'error'].map(k => [k, () => {}]))

// Keep the production consume, validation, crypto and history loops. Only disk I/O,
// notifications and the enclosing service graph are replaced by in-memory fixtures.
async function channelHarness(bundle, team, context, messages) {
  for (const id of ['./src/nest/auth/services/crypto/crypto.service.ts', './src/nest/storage/channels/messages/public-channel-messages.service.ts', './src/nest/storage/channels/channel.store.ts']) await bundle.webpack(id)
  const {CryptoService, PublicChannelMessagesService, ChannelStore} = bundle.profiler.classes
  assert.ok(CryptoService && PublicChannelMessagesService && ChannelStore)
  const chain = {team, context, user: context.user, roles: {amIMemberOfRole: role => team.memberHasRole(context.user.userId, role)}}
  chain.crypto = new CryptoService(chain)
  const service = new PublicChannelMessagesService({getChain: id => id === team.id ? chain : undefined})
  service.logger = quietLogger
  const channel = {id: 'profile-general', name: 'general', public: true, teamId: team.id}
  const entries = messages.map(m => ({id: m.contents.id, channelId: m.contents.channelId,
    createdAt: m.contents.createdAt, teamId: m.contents.teamId,
    encSignature: {author: m.signed.author, signature: m.signed.signature},
    contents: {contents: m.encrypted.contents, scope: m.encrypted.recipient}}))
  const store = new ChannelStore()
  store.channelData = channel; store.logger = quietLogger; store._messagesService = service
  store.localDbService = {getCurrentCommunity: async () => ({id: 'offline-profile'})}
  store.auth = {on() {}}
  let visible = []
  let update
  store.getStore = () => ({iterator: async function* () { for (const value of visible) yield {value} }, events: {on(event, fn) { assert.equal(event, 'update'); update = fn }}})
  store.startSync = async () => {}
  store._handleMessageOnUpdate = async () => {}
  return {store, service, entries, setVisible(v) { visible = v }, update: entry => update({payload: {value: entry}, hash: entry.id})}
}

async function historyCases(bundle, config, team, context, messages, users, role, record) {
  const harness = await channelHarness(bundle, team, context, messages)
  // These controls exercise the actual Quiet validation and signature-checking path.
  const good = await harness.service.onConsume(harness.entries[0], harness.store.channelData)
  assert.equal(good?.id, messages[0].contents.id)
  assert.equal(good?.verified, true)
  assert.equal(await harness.service.onConsume({...harness.entries[0], id: 'tampered-id'}, harness.store.channelData), undefined)
  const bad = {...harness.entries[0], contents: {...harness.entries[0].contents, contents: Uint8Array.from(harness.entries[0].contents.contents)}}
  bad.contents.contents[bad.contents.contents.length - 1] ^= 1
  assert.equal(await harness.service.onConsume(bad, harness.store.channelData), undefined)
  for (const count of config.history || []) {
    assert.ok(count <= messages.length)
    harness.setVisible(harness.entries.slice(0, count))
    bundle.profiler.reset()
    const start = performance.now()
    await harness.store.refreshMessageIds()
    const metrics = bundle.profiler.snapshot()
    assert.equal(metrics['PublicChannelMessagesService.onConsume.wall'].calls, count)
    assert.equal(metrics['CryptoService.decryptAndVerify'].calls, count)
    record({phase: 'refreshMessageIds', users, role, count, ms: performance.now() - start, metrics})
    await immediate()
  }
  // Structural work count, deliberately excluding crypto time. Invokes the actual
  // production update handler and history loop for every appended entry.
  if (config.shape?.length) {
    let calls = 0
    harness.store._messagesService = {onConsume: async entry => { calls++; return {id: entry.id, verified: true} }}
    for (const count of config.shape) {
      harness.setVisible([])
      await harness.store.subscribe()
      calls = 0
      for (let n = 1; n <= count; n++) {
        harness.setVisible(harness.entries.slice(0, n))
        await harness.update(harness.entries[n - 1])
      }
      assert.equal(calls, count + count * (count + 1) / 2)
      record({phase: 'serialArrivalWorkCount', users, role, count, consumeCalls: calls, timingClaim: false})
      await immediate()
    }
  }
}
async function run(bundle, config) {
  const profiler = bundle.profiler
  const auth = await bundle.webpack('../../3rd-party/auth/packages/auth/dist/index.js')
  const output = config.output
  fs.mkdirSync(output, {recursive: true, mode: 0o700})
  const write = (name, result) => {
    fs.writeFileSync(path.join(output, name + '.tmp'), JSON.stringify(result), {mode: 0o600})
    fs.renameSync(path.join(output, name + '.tmp'), path.join(output, name))
  }
  const messages = JSON.parse(fs.readFileSync(path.join(config.fixtures, 'messages.json'))).map(m => ({...m, encrypted: {...m.encrypted, contents: Uint8Array.from(Buffer.from(m.encrypted.contents, 'base64'))}}))
  const results = []
  for (const users of config.users) {
    const f = JSON.parse(fs.readFileSync(path.join(config.fixtures, 'team-' + users + '.json')))
    for (const role of config.roles || ['owner', 'member']) {
      if (!f[role]) continue
      profiler.reset()
      if (config.cpu) await profiler.cpuStart()
      let start = performance.now()
      const team = auth.loadTeam(Uint8Array.from(Buffer.from(f.source, 'base64')), f[role], f.teamKeyring)
      const loadMs = performance.now() - start
      if (config.cpu) await profiler.cpuStop(config.profilePrefix + '-load-' + users + '-' + role)
      assert.equal(team.members().length, users)
      const load = {phase: 'load', users, role, ms: loadMs, metrics: profiler.snapshot()}
      results.push(load); write('load-' + users + '-' + role + '.json', load)
      console.log(JSON.stringify({phase: 'load', users, role, ms: loadMs}))
      // Cryptographic sanity controls use the same loaded team and actual release functions.
      assert.deepEqual(team.decrypt(messages[0].encrypted), messages[0].contents)
      assert.equal(team.verify(messages[0].signed), true)
      assert.equal(team.verify({...messages[0].signed, contents: {...messages[0].contents, message: 'tampered'}}), false)
      const corrupt = {...messages[0].encrypted, contents: Uint8Array.from(messages[0].encrypted.contents)}
      corrupt.contents[corrupt.contents.length - 1] ^= 1
      assert.throws(() => team.decrypt(corrupt))
      for (const count of config.messages || []) {
        assert.ok(count <= messages.length)
        profiler.reset()
        const cpuBefore = process.cpuUsage()
        start = performance.now()
        let completed = 0
        for (const m of messages.slice(0, count)) {
          const contents = team.decrypt(m.encrypted)
          assert.equal(contents.id, m.contents.id)
          assert.equal(contents.message, m.contents.message)
          assert.equal(team.verify({...m.signed, contents}), true)
          completed++
          if (config.yieldEvery && completed % config.yieldEvery === 0) await immediate()
          if (config.limitSeconds && performance.now() - start > config.limitSeconds * 1000 && completed < count) break
        }
        const result = {phase: 'decryptAndVerify', users, role, requested: count, completed, censored: completed < count, ms: performance.now() - start, cpu: process.cpuUsage(cpuBefore), metrics: profiler.snapshot()}
        results.push(result); write('messages-' + users + '-' + role + '-' + count + '.json', result)
        write('results.json', results)
        console.log(JSON.stringify({...result, metrics: undefined}))
      }
      if (config.overheadControlCount) {
        const count = config.overheadControlCount
        assert.ok(count <= messages.length)
        profiler.setEnabled(false); start = performance.now()
        try {
          for (const m of messages.slice(0, count)) {
            const contents = team.decrypt(m.encrypted)
            assert.deepEqual(contents, m.contents)
            assert.equal(team.verify({...m.signed, contents}), true)
          }
        } finally { profiler.setEnabled(true) }
        const result = {phase: 'instrumentationDisabledControl', users, role, count, ms: performance.now() - start}
        results.push(result); write('uninstrumented-' + users + '-' + role + '.json', result)
      }
      if (config.history?.length || config.shape?.length) await historyCases(bundle, config, team, f[role], messages, users, role, result => {
        results.push(result)
        write(result.phase + '-' + users + '-' + role + '-' + result.count + '.json', result)
        write('results.json', results)
      })
      // Raw symmetric decryption with the already selected role key separates primitive cost
      // from repeated LFA lockbox traversal. This is a measurement, not a shipped bypass.
      const key = team.keys(messages[0].encrypted.recipient).secretKey
      if (config.reuseValidatedKeyCount) {
        const count = config.reuseValidatedKeyCount
        assert.ok(count <= messages.length)
        profiler.reset(); start = performance.now()
        for (let i = 0; i < count; i++) {
          const m = messages[i]
          const contents = auth.symmetric.decryptBytes(m.encrypted.contents, key)
          assert.deepEqual(contents, m.contents)
          assert.equal(team.verify({...m.signed, contents}), true)
          if ((i + 1) % 10 === 0) await immediate()
        }
        const result = {phase: 'reuseValidatedKeyControl', users, role, count, ms: performance.now() - start, metrics: profiler.snapshot(), productionFix: false}
        results.push(result); write('reuse-key-' + users + '-' + role + '.json', result)
      }
      for (const [phase, action] of [
        ['symmetricPrimitive', m => auth.symmetric.decryptBytes(m.encrypted.contents, key)],
        ['signaturePrimitive', m => team.verify(m.signed)],
        ['keyLookup', m => team.keys(m.encrypted.recipient)],
      ]) {
        profiler.reset(); start = performance.now()
        const n = config.primitiveCount || 10
        for (let i = 0; i < n; i++) action(messages[i % messages.length])
        const result = {phase, users, role, count: n, ms: performance.now() - start, metrics: profiler.snapshot()}
        results.push(result); write(phase + '-' + users + '-' + role + '.json', result)
        console.log(JSON.stringify({...result, metrics: undefined}))
      }
      write('results.json', results)
      await immediate()
    }
  }
  write('complete.json', {passed: true, scenarios: results.length, utc: new Date().toISOString()})
  return results
}
module.exports = {run, channelHarness, historyCases}
if (require.main === module) {
  const config = JSON.parse(fs.readFileSync(process.argv[3]))
  const bundle = require(path.resolve(process.argv[2]))
  run(bundle, config).then(() => process.exit(0)).catch(error => {console.error(error.message); process.exit(1)})
}
