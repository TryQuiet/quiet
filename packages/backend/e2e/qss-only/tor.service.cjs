const { EventEmitter } = require('node:events')
const { randomBytes, createHash } = require('node:crypto')
const { requireQssOnlyEnvironment } = require('./mode.cjs')

// This class is only selected by the dedicated E2E webpack configuration.
// These are simulated identity fields, never actual onion services or keys.
function simulatedOnion(privateKey) {
  if (!/^QSS-ONLY-E2E:[a-f0-9]{64}$/.test(privateKey)) throw new Error('Expected QSS-only simulated Tor metadata')
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567'
  const bytes = createHash('sha512').update(privateKey).digest().subarray(0, 35)
  let bits = ''
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0')
  return `${bits.match(/.{5}/g).map(group => alphabet[parseInt(group, 2)]).join('')}.onion`
}

class Tor extends EventEmitter {
  constructor() {
    super()
    requireQssOnlyEnvironment()
    this.process = null
    this.bootstrapped = false
    this.hiddenServices = new Map()
    this.initializedHiddenServices = new Map()
  }

  async onModuleInit() { await this.init() }
  async onModuleDestroy() { await this.kill() }
  async init() {
    // A wake restores registered identity metadata without creating a Tor process or socket.
    this.initializedHiddenServices = new Map(this.hiddenServices)
    this.bootstrapped = true
    this.emit('bootstrapped')
  }
  async kill() {
    this.bootstrapped = false
    this.initializedHiddenServices.clear()
  }
  async isBootstrappingFinished() { return this.bootstrapped }
  resetHiddenServices() {
    this.hiddenServices.clear()
    this.initializedHiddenServices.clear()
  }
  async destroyHiddenService(serviceId) {
    serviceId = serviceId.replace(/\.onion$/, '')
    this.initializedHiddenServices.delete(serviceId)
    return this.hiddenServices.delete(serviceId)
  }
  async createNewHiddenService({ targetPort, virtPort = 80 } = {}) {
    const privateKey = `QSS-ONLY-E2E:${randomBytes(32).toString('hex')}`
    const onionAddress = await this.spawnHiddenService({ targetPort, virtPort, privKey: privateKey })
    return { privateKey, onionAddress }
  }
  registeredMetadata({ targetPort, privKey, onionAddress = simulatedOnion(privKey), virtPort = 80 }) {
    const expected = simulatedOnion(privKey)
    if (onionAddress.replace(/\.onion$/, '') !== expected.replace(/\.onion$/, '')) {
      throw new Error('QSS-only simulated onion address does not match its identity metadata')
    }
    return { targetPort, privKey, virtPort, onionAddress: expected.replace(/\.onion$/, '') }
  }
  registerHiddenService(params) {
    const service = this.registeredMetadata(params)
    this.hiddenServices.set(service.onionAddress, service)
    if (this.bootstrapped) this.initializedHiddenServices.set(service.onionAddress, service)
  }
  async spawnHiddenServices() {
    this.initializedHiddenServices = new Map(this.hiddenServices)
  }
  async spawnHiddenService(params) {
    const service = this.registeredMetadata(params)
    this.hiddenServices.set(service.onionAddress, service)
    this.initializedHiddenServices.set(service.onionAddress, service)
    return `${service.onionAddress}.onion`
  }
  rewireNativeTor() { throw new Error('Native Tor lifecycle is outside the Android QSS-only E2E mode') }
}

module.exports = { Tor, simulatedOnion }
