// Generates the Ed25519 key pair that signs desktop updates. The private key is written to the
// given file (mode 0600) and never printed; the public key is printed for update-signing-keys.json.
// Usage: node generateUpdateSigningKey.cjs <private-key-file>
const crypto = require('node:crypto')
const fs = require('node:fs')
const { publicKeyOf } = require('./updateSigning.cjs')

const target = process.argv[2]
if (!target) {
  console.error('usage: generateUpdateSigningKey.cjs <private-key-file>')
  process.exit(2)
}
const { privateKey } = crypto.generateKeyPairSync('ed25519')
fs.writeFileSync(target, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' })
console.log(`private key written to ${target}`)
console.log(`public key: ${publicKeyOf(privateKey)}`)
