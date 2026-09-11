import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import net from 'node:net'
import { once } from 'node:events'
import { NestFactory } from '@nestjs/core'
import { multiaddr } from '@multiformats/multiaddr'
import { createLibp2p } from './libp2p.js'
import tor from './tor.service.cjs'
import module from './tor.module.cjs'
import mode from './mode.cjs'

const environment = { IS_E2E: 'true', QSS_ALLOWED: 'true', QSS_ENDPOINT: mode.ENDPOINT }
const previous = Object.fromEntries(Object.keys(environment).map(key => [key, process.env[key]]))
before(() => Object.assign(process.env, environment))
after(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

test('the fixture cannot initialize for a shipping or remote-QSS environment', async () => {
  mode.requireQssOnlyEnvironment(environment)
  for (const invalid of [
    {}, { ...environment, IS_E2E: 'false' }, { ...environment, QSS_ALLOWED: 'false' },
    { ...environment, QSS_ENDPOINT: 'wss://qss-prod.quiet-services.app' },
    { ...environment, QSS_ENDPOINT: 'ws://10.0.2.2:3003' },
  ]) assert.throws(() => mode.requireQssOnlyEnvironment(invalid), /QSS-only E2E backend requires/)
})

test('Nest initializes and restarts the Tor replacement without any child process or control connection', async t => {
  for (const method of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
    t.mock.method(childProcess, method, () => { throw new Error(`Unexpected child process: ${method}`) })
  }
  t.mock.method(net, 'connect', () => { throw new Error('Unexpected Tor control connection') })
  const app = await NestFactory.createApplicationContext(module.TorModule, { logger: false })
  try {
    const replacement = app.get(tor.Tor)
    assert.equal(replacement.process, null)
    assert.equal(await replacement.isBootstrappingFinished(), true)
    const first = await replacement.createNewHiddenService({ targetPort: 9999 })
    assert.match(first.onionAddress, /^[a-z2-7]{56}\.onion$/)
    assert.match(first.privateKey, /^QSS-ONLY-E2E:/)
    assert.equal(await replacement.spawnHiddenService({ privKey: first.privateKey }), first.onionAddress)
    await replacement.destroyHiddenService(first.onionAddress.split('.')[0])
    await replacement.kill()
    assert.equal(await replacement.isBootstrappingFinished(), false)
    await replacement.init()
    assert.equal(await replacement.isBootstrappingFinished(), true)
    assert.equal(await new tor.Tor().spawnHiddenService({ privKey: first.privateKey }), first.onionAddress)
    await assert.rejects(replacement.spawnHiddenService({ privKey: 'an-actual-tor-key' }), /simulated Tor metadata/)
    assert.throws(() => replacement.rewireNativeTor({}), /outside the Android QSS-only/)
    assert.deepEqual(Reflect.getMetadata('providers', module.TorModule), [tor.Tor])
  } finally {
    await app.close()
  }
})

test('real libp2p keeps local services but cannot create a transport, listen, discover or dial a peer', async () => {
  let transportCreated = false
  let discoveryCreated = false
  let connections = 0
  const trap = net.createServer(socket => { connections++; socket.destroy() })
  trap.listen(0, '127.0.0.1')
  await once(trap, 'listening')
  const node = await createLibp2p({
    addresses: { listen: ['/ip4/127.0.0.1/tcp/0'], announce: ['/ip4/127.0.0.1/tcp/1234'] },
    transports: [() => { transportCreated = true; throw new Error('Transport must never be constructed') }],
    peerDiscovery: [() => { discoveryCreated = true; throw new Error('Discovery must never be constructed') }],
    connectionGater: { denyDialPeer: () => false },
    services: { fixture: () => ({ value: 'real service instance' }) },
  })
  const other = await createLibp2p()
  try {
    await node.start()
    assert.equal(node.services.fixture.value, 'real service instance')
    assert.deepEqual(node.getMultiaddrs(), [])
    assert.deepEqual(node.getConnections(), [])
    await assert.rejects(node.dial(multiaddr(`/ip4/127.0.0.1/tcp/${trap.address().port}/p2p/${other.peerId}`)), /denied|gater|transport|addresses/i)
    assert.equal(transportCreated, false)
    assert.equal(discoveryCreated, false)
    assert.equal(connections, 0)
    await node.stop()
    await node.start()
    assert.deepEqual(node.getMultiaddrs(), [])
    await assert.rejects(node.dial(other.peerId), /denied|gater|transport|addresses/i)
    assert.deepEqual(node.getConnections(), [])
  } finally {
    await node.stop()
    await other.stop()
    await new Promise(resolve => trap.close(resolve))
  }
})
