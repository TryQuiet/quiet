const assert = require('node:assert/strict')
const legacy = require('./legacy-auth.json')

async function main() {
  const crypto = await import('../../../backend/node_modules/@localfirst/crypto/index.js')
  const auth = await import('../../../backend/node_modules/@localfirst/auth/index.js')
  // Existing encrypted communities and signatures must survive the Electron /
  // Node upgrade, as well as fresh community creation on the new runtime.
  assert.deepEqual(crypto.symmetric.decrypt(legacy.cipher, legacy.password), legacy.payload)
  assert.equal(crypto.hash(legacy.purpose, legacy.payload), legacy.hash)
  const signed = {
    payload: legacy.payload,
    signature: legacy.signature,
    publicKey: legacy.publicKey,
    context: legacy.signatureContext,
  }
  assert.equal(crypto.signatures.verify(signed), true)
  assert.equal(crypto.signatures.verify({ ...signed, context: 'wrong-context' }), false)
  assert.equal(crypto.signatures.verify({ ...signed, payload: { ...legacy.payload, active: false } }), false)
  const restored = auth.loadTeam(Buffer.from(legacy.team.chain, 'base64'), legacy.team.context, legacy.team.keys)
  assert.equal(restored.teamName, legacy.team.name)
  const firstUseDevice = auth.createFirstUseDevice({ deviceName: 'Electron 44 desktop' })
  const device = { ...firstUseDevice, userId: auth.deriveUserId(firstUseDevice.deviceId) }
  const user = auth.createUser('Alice', device.userId)
  const context = { user, device }
  const name = 'Quiet 🌱 community '.repeat(10)
  const team = auth.createTeam(name, context)
  assert.equal(auth.loadTeam(team.save(), context, team.teamKeyring()).teamName, name)
  console.log(
    'PASS Electron auth: legacy ciphertext/hash/signature/community, tamper rejection, fresh community save/load'
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
