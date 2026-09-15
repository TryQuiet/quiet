'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const {createFixtures} = require('./fixtures.cjs')
const {run, historyCases} = require('./bench.cjs')

function isolateUnusedNativeServices(bundle) {
  // The iOS bundle cannot load classic-level's iOS binary on Linux. These imports
  // are only DI metadata or unused storage initialization paths in this test.
  // Keep ChannelStore, its base class, public message validation and all LFA/crypto
  // implementations intact. Throw if the harness accidentally instantiates a stub.
  const names = {
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
  for (const [id, name] of Object.entries(names)) {
    assert.ok(bundle.webpack.m[id], 'Expected bundled dependency ' + id)
    assert.equal(bundle.webpack.c[id], undefined, 'Dependency must not have loaded yet')
    bundle.webpack.c[id] = {exports: {[name]: class { constructor() { throw new Error('Unexpected use of ' + name) } }}}
  }
}

test('released LFA admits a real member, reads signed history and rejects tampering', {skip: !process.env.QUIET_PROFILE_BUNDLE}, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-profile-test-'))
  try {
    process.env.QUIET_PROFILE_EXPORT_ONLY = '1'
    process.env.QUIET_PROFILE_DIRECTORY = path.join(directory, 'runtime')
    const bundle = require(path.resolve(process.env.QUIET_PROFILE_BUNDLE))
    const fixtures = path.join(directory, 'fixtures')
    const receipts = await createFixtures(bundle, fixtures, [1, 2], 1000)
    assert.deepEqual(receipts.map(r => r.users), [1, 2])
    const results = await run(bundle, {fixtures, output: path.join(directory, 'results'), users: [2], roles: ['member'], messages: [1, 5], primitiveCount: 2, reuseValidatedKeyCount: 5})
    const rows = results.filter(r => r.phase === 'decryptAndVerify')
    assert.deepEqual(rows.map(r => r.completed), [1, 5])
    assert.ok(rows.every(r => !r.censored))
    assert.equal(rows[1].metrics['LFA.keyMap'].calls, 5)
    assert.equal(rows[1].metrics['sodium.crypto_sign_verify_detached'].calls, 5)
    const reuse = results.find(r => r.phase === 'reuseValidatedKeyControl')
    assert.equal(reuse.metrics['sodium.crypto_sign_verify_detached'].calls, 5)
    assert.equal(reuse.metrics['LFA.keyMap'], undefined)
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'results/complete.json'))).passed, true)
    isolateUnusedNativeServices(bundle)
    const auth = await bundle.webpack('../../3rd-party/auth/packages/auth/dist/index.js')
    const f = JSON.parse(fs.readFileSync(path.join(fixtures, 'team-2.json')))
    const messages = JSON.parse(fs.readFileSync(path.join(fixtures, 'messages.json'))).map(m => ({...m, encrypted: {...m.encrypted, contents: Buffer.from(m.encrypted.contents, 'base64')}}))
    const team = auth.loadTeam(Buffer.from(f.source, 'base64'), f.member, f.teamKeyring)
    const history = []
    await historyCases(bundle, {history: [1, 10], shape: [1, 10, 100, 1000]}, team, f.member, messages, 2, 'member', row => history.push(row))
    assert.deepEqual(history.filter(r => r.phase === 'refreshMessageIds').map(r => r.metrics['CryptoService.decryptAndVerify'].calls), [1, 10])
    assert.deepEqual(history.filter(r => r.phase === 'serialArrivalWorkCount').map(r => r.consumeCalls), [2, 65, 5150, 501500])
  } finally {
    fs.rmSync(directory, {recursive: true, force: true})
  }
})
