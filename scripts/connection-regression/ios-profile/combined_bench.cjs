'use strict'
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const {performance} = require('node:perf_hooks')
const immediate = () => new Promise(resolve => setImmediate(resolve))
const quietLogger = Object.fromEntries(['trace', 'debug', 'info', 'warn', 'error'].map(name => [name, () => {}]))

// Real ChannelStore + PublicChannelMessagesService + CryptoService; only the
// OrbitDB persistence/transport and notifications are replaced by in-memory I/O.
async function harness(bundle, team, context, messages) {
  for (const id of ['./src/nest/auth/services/crypto/crypto.service.ts', './src/nest/storage/channels/messages/public-channel-messages.service.ts', './src/nest/storage/channels/channel.store.ts']) await bundle.webpack(id)
  const {CryptoService, PublicChannelMessagesService, ChannelStore} = bundle.profiler.classes
  const chain = {team, context, user: context.user, roles: {amIMemberOfRole: role => team.memberHasRole(context.user.userId, role)}}
  chain.crypto = new CryptoService(chain)
  const consumer = new PublicChannelMessagesService({getChain: id => id === team.id ? chain : undefined})
  consumer.logger = quietLogger
  const channel = {id: 'profile-general', name: 'general', public: true, teamId: team.id}
  const entries = messages.map(m => ({id: m.contents.id, channelId: m.contents.channelId, createdAt: m.contents.createdAt,
    teamId: m.contents.teamId, encSignature: {author: m.signed.author, signature: m.signed.signature},
    contents: {contents: m.encrypted.contents, scope: m.encrypted.recipient}}))
  const store = new ChannelStore()
  store.channelData = channel; store.logger = quietLogger; store._messagesService = consumer
  store.localDbService = {getCurrentCommunity: async () => ({id: 'offline-profile'})}
  store.auth = {on() {}, off() {}}
  let visible = [], byHash = new Map(), update
  const io = {iterated: 0, gets: 0}
  store.getStore = () => ({
    iterator: async function* () { for (const value of visible) { io.iterated++; yield {hash: value.id, value} } },
    get: async hash => { io.gets++; return byHash.get(hash) },
    events: {on(name, fn) { assert.equal(name, 'update'); update = fn }},
  })
  store.startSync = async () => {}
  store._handleMessageOnUpdate = async () => {}
  const events = []
  store.emit = (name, payload) => { events.push({name, payload}); return true }
  return {store, consumer, entries, events, io,
    setVisible(values) { visible = values; byHash = new Map(values.map(value => [value.id, value])) },
    append(value) { visible.push(value); byHash.set(value.id, value) },
    resetIo() { io.iterated = 0; io.gets = 0 },
    update(value) { return update({hash: value.id, payload: {value}}) },
  }
}

exports.run = async (bundle, config) => {
  const original = require(fs.existsSync(path.join(__dirname, 'original-bench.cjs')) ? './original-bench.cjs' : './bench.cjs')
  fs.mkdirSync(config.output, {recursive: true})
  const write = (name, value) => fs.writeFileSync(path.join(config.output, name), JSON.stringify(value))
  const results = []
  const record = value => { results.push(value); write('combined-results.json', results) }
  const auth = await bundle.webpack('../../3rd-party/auth/packages/auth/dist/index.js')
  const messages = JSON.parse(fs.readFileSync(path.join(config.fixtures, 'messages.json'))).map(m => ({...m, encrypted: {...m.encrypted, contents: Uint8Array.from(Buffer.from(m.encrypted.contents, 'base64'))}}))
  const load = users => {
    const fixture = JSON.parse(fs.readFileSync(path.join(config.fixtures, 'team-' + users + '.json')))
    return {fixture, team: auth.loadTeam(Uint8Array.from(Buffer.from(fixture.source, 'base64')), fixture.member, fixture.teamKeyring)}
  }
  for (const users of config.firstMessageUsers || []) {
    bundle.profiler.reset(); let start = performance.now()
    const {team: freshTeam} = load(users)
    record({phase: 'freshTeamInstanceLoad', users, ms: performance.now() - start, metrics: bundle.profiler.snapshot()})
    bundle.profiler.reset(); start = performance.now()
    const m = messages[0]
    const contents = freshTeam.decrypt(m.encrypted)
    assert.deepEqual(contents, m.contents)
    assert.equal(freshTeam.verify({...m.signed, contents}), true)
    record({phase: 'firstMessageOnFreshTeamInstance', users, ms: performance.now() - start, metrics: bundle.profiler.snapshot()})
    await immediate()
  }
  if (config.messageRepeats) {
    for (let repeat = 1; repeat <= config.messageRepeats; repeat++) {
      await original.run(bundle, {...config, users: [2], roles: ['member'], messages: [1000], history: [], shape: [], output: path.join(config.output, 'messages-repeat-' + repeat)})
    }
  }
  if (config.userScale) {
    for (let repeat = 1; repeat <= (config.userRepeats || 1); repeat++) {
      await original.run(bundle, {...config, users: config.userScale, roles: ['member'], messages: [10], history: [], shape: [], output: path.join(config.output, 'users-repeat-' + repeat)})
    }
  }
  // An idle command must not warm any fixture prefix before process-cold tests.
  const {fixture, team} = (config.historyScale?.length || config.arrivalScale?.length) ? load(2) : {}
  for (const count of config.historyScale || []) {
    const h = await harness(bundle, team, fixture.member, messages)
    h.setVisible(h.entries.slice(0, count))
    bundle.profiler.reset(); let start = performance.now()
    await h.store.refreshMessageIds()
    let metrics = bundle.profiler.snapshot()
    assert.equal(metrics['PublicChannelMessagesService.onConsume.wall'].calls, count)
    assert.equal(h.store.messageIds.size, count)
    record({phase: 'coldHistoryIndex', count, ms: performance.now() - start, io: {...h.io}, metrics})
    h.resetIo(); bundle.profiler.reset(); start = performance.now()
    await h.store.refreshMessageIds()
    metrics = bundle.profiler.snapshot()
    assert.equal(metrics['PublicChannelMessagesService.onConsume.wall']?.calls || 0, 0)
    assert.equal(h.io.iterated, 0)
    record({phase: 'warmHistoryIndex', count, ms: performance.now() - start, io: {...h.io}, metrics})
    h.resetIo(); bundle.profiler.reset(); start = performance.now()
    const one = await h.store.getEntries([h.entries[count - 1].id])
    assert.equal(one.length, 1); assert.equal(one[0].id, h.entries[count - 1].id)
    assert.equal(h.io.iterated, 0); assert.equal(h.io.gets, 1)
    record({phase: 'singleMessageFetch', count, ms: performance.now() - start, io: {...h.io}, metrics: bundle.profiler.snapshot()})
    await immediate()
  }
  for (const count of config.arrivalScale || []) {
    const h = await harness(bundle, team, fixture.member, messages)
    await h.store.subscribe()
    h.resetIo(); h.events.length = 0
    bundle.profiler.reset(); const start = performance.now()
    for (const value of h.entries.slice(0, count)) {
      h.append(value); await h.update(value)
      const got = await h.store.getEntries([value.id])
      assert.equal(got.length, 1); assert.equal(got[0].id, value.id); assert.equal(got[0].verified, true)
      if (config.yieldEvery && h.io.gets % config.yieldEvery === 0) await immediate()
    }
    const metrics = bundle.profiler.snapshot()
    assert.equal(metrics['PublicChannelMessagesService.onConsume.wall'].calls, 2 * count)
    assert.equal(h.io.iterated, 0); assert.equal(h.io.gets, count)
    assert.equal(h.store.messageIds.size, count)
    const ids = h.events.filter(event => Array.isArray(event.payload?.ids)).flatMap(event => event.payload.ids)
    assert.deepEqual(ids, h.entries.slice(0, count).map(value => value.id))
    record({phase: 'serialArrivalAndFrontendFetch', count, consumeCalls: 2 * count, ms: performance.now() - start, io: {...h.io}, metrics})
    await immediate()
  }
  const crdx = await bundle.webpack('../../3rd-party/auth/packages/crdx/dist/index.js')
  const {unpack} = await bundle.webpack('../../3rd-party/auth/node_modules/.pnpm/msgpackr@1.11.2/node_modules/msgpackr/node-index.js')
  for (const users of config.editionUsers || []) {
    const {fixture: f, team: member} = load(users)
    const owner = auth.loadTeam(Uint8Array.from(Buffer.from(f.source, 'base64')), f.owner, f.teamKeyring)
    for (let edition = 1; edition <= (config.editions || 3); edition++) {
      owner.addMessage({type: 'PERFORMANCE_PROBE', payload: {sequence: edition}})
      const wireBytes = owner.save()
      // Include actual wire decode/decryption plus Team.merge; exclude sender
      // construction/serialization. New roles would add key distribution costs.
      bundle.profiler.reset(); const start = performance.now()
      const graph = crdx.decryptGraph({encryptedGraph: unpack(wireBytes), keys: f.teamKeyring})
      member.merge(graph)
      const metrics = bundle.profiler.snapshot()
      assert.deepEqual(member.graph.head, owner.graph.head)
      record({phase: 'sameProcessSenderEdition', users, edition, ms: performance.now() - start, metrics})
      await immediate()
    }
  }
  // These wire bytes must be produced by a separate sender process. Constructing
  // the sender here would warm process-global validation facts before receipt.
  for (const users of config.wireEditionUsers || []) {
    const {fixture: f, team: member} = load(users)
    for (let edition = 1; edition <= (config.wireEditions || 2); edition++) {
      const wireBytes = fs.readFileSync(path.join(config.wireFixtures || config.fixtures, `edition-${users}-${edition}.bin`))
      bundle.profiler.reset(); const start = performance.now()
      const graph = crdx.decryptGraph({encryptedGraph: unpack(wireBytes), keys: f.teamKeyring})
      member.merge(graph)
      const elapsed = performance.now() - start
      const metrics = bundle.profiler.snapshot()
      assert.equal(member.members().length, users)
      assert.equal(member.messages().at(-1).payload.sequence, edition)
      record({phase: 'separateSenderReceivedEdition', users, edition, ms: elapsed, metrics})
      if (config.requireIncrementalSignatureCount !== false) assert.equal(metrics['sodium.crypto_sign_verify_detached']?.calls, 1)
      assert.equal(metrics['sodium.crypto_box_open_easy']?.calls, 7)
      await immediate()
    }
  }
  write('complete.json', {passed: true, messageRepeats: config.messageRepeats || 0, userScale: config.userScale || [], cases: results.length,
    runtime: {pid: process.pid, platform: process.platform, weakRef: typeof WeakRef, webAssembly: typeof WebAssembly}})
}
exports.harness = harness
