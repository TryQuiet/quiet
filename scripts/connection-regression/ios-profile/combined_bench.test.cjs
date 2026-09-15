'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

test('integrated harness consumes real encrypted arrivals and fetches each by hash', {
  skip: !process.env.QUIET_PROFILE_COMBINED_BUNDLE || !process.env.QUIET_PROFILE_COMBINED_FIXTURES,
}, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-combined-profile-'))
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform')
  try {
    Object.defineProperty(process, 'platform', {value: 'ios'})
    process.env.QUIET_PROFILE_EXPORT_ONLY = '1'
    process.env.QUIET_PROFILE_DIRECTORY = path.join(directory, 'runtime')
    const bundle = require(path.resolve(process.env.QUIET_PROFILE_COMBINED_BUNDLE))
    // Preserve the actual channel, base store, consume/validation and crypto code.
    // These services are unused DI imports; their iOS binaries cannot load on Linux.
    const stubs = {
      './src/nest/auth/sigchain.service.ts': 'SigChainService',
      './src/nest/storage/orbitDb/orbitDb.service.ts': 'OrbitDbService',
      './src/nest/storage/orbitDb/eventsWithStorage.ts': 'EventsWithStorage',
      './src/nest/local-db/local-db.service.ts': 'LocalDbService',
      './src/nest/storage/userProfile/userProfile.store.ts': 'UserProfileStore',
      './src/nest/storage/channels/messages/orbitdb/MessagesAccessController.ts': 'MessagesAccessController',
      './src/nest/storage/channels/messages/orbitdb/PrivateMessagesAccessController.ts': 'PrivateMessagesAccessController',
      './src/nest/storage/channels/messages/private-channel-messages.service.ts': 'PrivateChannelMessagesService',
      '../../3rd-party/orbitdb/src/index.js': 'useAccessController',
    }
    for (const [id, name] of Object.entries(stubs)) {
      assert.ok(bundle.webpack.m[id]); assert.equal(bundle.webpack.c[id], undefined)
      bundle.webpack.c[id] = {exports: {[name]: class { constructor() { throw new Error('Unexpected use of ' + name) } }}}
    }
    await require('./combined_bench.cjs').run(bundle, {fixtures: path.resolve(process.env.QUIET_PROFILE_COMBINED_FIXTURES),
      output: path.join(directory, 'results'), firstMessageUsers: [2], editionUsers: [2], editions: 2,
      wireFixtures: process.env.QUIET_PROFILE_WIRE_FIXTURES, wireEditionUsers: process.env.QUIET_PROFILE_WIRE_FIXTURES ? [10, 100] : [],
      historyScale: [1, 10, 100], arrivalScale: [1, 10, 100, 1000], yieldEvery: 10})
    const rows = JSON.parse(fs.readFileSync(path.join(directory, 'results/combined-results.json')))
    assert.equal(rows.find(r => r.phase === 'firstMessageOnFreshTeamInstance').metrics['sodium.crypto_sign_verify_detached'].calls, 1)
    assert.equal(rows.filter(r => r.phase === 'sameProcessSenderEdition').length, 2)
    if (process.env.QUIET_PROFILE_WIRE_FIXTURES) assert.equal(rows.filter(r => r.phase === 'separateSenderReceivedEdition').length, 4)
    assert.deepEqual(rows.filter(r => r.phase === 'serialArrivalAndFrontendFetch').map(r => r.consumeCalls), [2, 20, 200, 2000])
    assert.ok(rows.filter(r => r.phase === 'warmHistoryIndex').every(r => r.io.iterated === 0))
    assert.ok(rows.filter(r => r.phase === 'singleMessageFetch').every(r => r.io.gets === 1 && r.io.iterated === 0))
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'results/complete.json'))).passed, true)
  } finally {
    Object.defineProperty(process, 'platform', descriptor)
    fs.rmSync(directory, {recursive: true, force: true})
  }
})
