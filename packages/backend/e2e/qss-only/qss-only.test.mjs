import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import net from 'node:net'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import { NestFactory } from '@nestjs/core'
import { multiaddr } from '@multiformats/multiaddr'
import { ConnectionProcessInfo, SocketEvents } from '@quiet/types'
import ts from 'typescript'
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

function forbidTorIo(t) {
  for (const method of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
    t.mock.method(childProcess, method, () => { throw new Error(`Unexpected child process: ${method}`) })
  }
  t.mock.method(net, 'connect', () => { throw new Error('Unexpected Tor control connection') })
  t.mock.method(net.Socket.prototype, 'connect', () => { throw new Error('Unexpected Tor socket connection') })
}

test('the fixture cannot initialize for a shipping or remote-QSS environment', async () => {
  mode.requireQssOnlyEnvironment(environment)
  for (const invalid of [
    {}, { ...environment, IS_E2E: 'false' }, { ...environment, QSS_ALLOWED: 'false' },
    { ...environment, QSS_ENDPOINT: 'wss://qss-prod.quiet-services.app' },
    { ...environment, QSS_ENDPOINT: 'ws://10.0.2.2:3003' },
  ]) assert.throws(() => mode.requireQssOnlyEnvironment(invalid), /QSS-only E2E backend requires/)
})

test('Nest initializes and restarts the Tor replacement without any child process or control connection', async t => {
  forbidTorIo(t)
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

test('the production community launch method registers persisted QSS-only identity metadata', async t => {
  forbidTorIo(t)
  // Execute the actual production method that previously failed at registerHiddenService.
  // Extracting just this method avoids replacing its code or booting unrelated backend services.
  const source = ts.createSourceFile(
    'connections-manager.service.ts',
    readFileSync(new URL('../../src/nest/connections-manager/connections-manager.service.ts', import.meta.url), 'utf8'),
    ts.ScriptTarget.ES2022,
    true,
  )
  const declaration = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'ConnectionsManagerService')
  const method = declaration?.members.find(node => node.name?.getText(source) === 'spawnTorHiddenService')
  assert.ok(method, 'The community launch Tor integration must exist')
  const compiled = ts.transpileModule(`class LaunchConsumer { ${method.getText(source)} }`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  const LaunchConsumer = new Function('SocketEvents', 'ConnectionProcessInfo', `${compiled}; return LaunchConsumer`)(SocketEvents, ConnectionProcessInfo)
  const replacement = new tor.Tor()
  await replacement.init()
  const hiddenService = await replacement.createNewHiddenService({ targetPort: 9999 })
  assert.equal(await replacement.destroyHiddenService(hiddenService.onionAddress), true)
  const events = []
  const consumer = Object.assign(new LaunchConsumer(), {
    tor: replacement,
    ports: { libp2pHiddenService: 9999 },
    logger: { info() {} },
    serverIoProvider: { io: { emit: (...args) => events.push(args) } },
  })

  const address = await consumer.spawnTorHiddenService('qss-fixture-community', {
    networkInfo: { hiddenService, peerId: { id: 'fixture-peer' } },
  })
  assert.equal(address, hiddenService.onionAddress)
  assert.deepEqual(events, [[SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE]])
  assert.equal(replacement.hiddenServices.size, 1)
  assert.equal(replacement.initializedHiddenServices.size, 1)
  assert.equal(replacement.process, null)
  await replacement.kill()
})

test('simulated service registrations survive hibernation, normalize addresses and clear on leave', async t => {
  forbidTorIo(t)
  const replacement = new tor.Tor()
  const identity = await replacement.createNewHiddenService({ targetPort: 9999 })
  const serviceId = identity.onionAddress.replace(/\.onion$/, '')
  const registration = { targetPort: 9999, privKey: identity.privateKey, onionAddress: identity.onionAddress, virtPort: 80 }
  assert.equal(await replacement.destroyHiddenService(serviceId), true)
  assert.equal(await replacement.destroyHiddenService(serviceId), false)
  assert.equal(replacement.registerHiddenService(registration), undefined)
  replacement.registerHiddenService({ ...registration, onionAddress: serviceId })
  assert.equal(replacement.hiddenServices.size, 1)
  assert.equal(replacement.initializedHiddenServices.size, 0)

  let bootstrapCount = 0
  replacement.on('bootstrapped', () => {
    bootstrapCount++
    assert.equal(replacement.initializedHiddenServices.size, 1)
  })
  await replacement.init()
  assert.equal(await replacement.spawnHiddenService(registration), identity.onionAddress)
  assert.equal(await replacement.isBootstrappingFinished(), true)
  await replacement.kill()
  assert.equal(await replacement.isBootstrappingFinished(), false)
  assert.equal(replacement.initializedHiddenServices.size, 0)
  assert.equal(replacement.hiddenServices.size, 1)
  await replacement.init()
  assert.equal(bootstrapCount, 2)
  assert.deepEqual(replacement.initializedHiddenServices.get(serviceId), { ...registration, onionAddress: serviceId })

  replacement.resetHiddenServices()
  assert.equal(replacement.hiddenServices.size, 0)
  assert.equal(replacement.initializedHiddenServices.size, 0)
  await replacement.spawnHiddenServices()
  assert.equal(replacement.initializedHiddenServices.size, 0)
  await replacement.kill()
  assert.equal(replacement.process, null)
  assert.throws(() => replacement.registerHiddenService({ ...registration, privKey: 'an-actual-tor-key' }), /simulated Tor metadata/)
  assert.throws(() => replacement.registerHiddenService({ ...registration, onionAddress: 'other.onion' }), /does not match/)
  assert.equal(replacement.hiddenServices.size, 0)
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
