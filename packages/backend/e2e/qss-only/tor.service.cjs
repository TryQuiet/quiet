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
  }

  async onModuleInit() { await this.init() }
  async onModuleDestroy() { await this.kill() }
  async init() {
    this.bootstrapped = true
    this.emit('bootstrapped')
  }
  async kill() { this.bootstrapped = false }
  async isBootstrappingFinished() { return this.bootstrapped }
  resetHiddenServices() {}
  async destroyHiddenService() { return true }
  async createNewHiddenService() {
    const privateKey = `QSS-ONLY-E2E:${randomBytes(32).toString('hex')}`
    return { privateKey, onionAddress: simulatedOnion(privateKey) }
  }
  async spawnHiddenService({ privKey }) { return simulatedOnion(privKey) }
  rewireNativeTor() { throw new Error('Native Tor lifecycle is outside the Android QSS-only E2E mode') }
}

module.exports = { Tor, simulatedOnion }
