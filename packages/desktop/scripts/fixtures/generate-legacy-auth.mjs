// Reproduce the pre-upgrade runtime fixture using Node 20 and the auth checkout
// pinned by PR #3422. All generated keys and passwords are public test data.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

assert.equal(process.versions.node.split('.')[0], '20', 'Generate this fixture with Node 20')
const authRoot = path.resolve(process.argv[2])
const auth = await import(pathToFileURL(path.join(authRoot, 'packages/auth/dist/index.js')))
const crypto = await import(pathToFileURL(path.join(authRoot, 'packages/crypto/dist/index.js')))
const commit = execFileSync('git', ['-C', authRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const payload = {
  message: 'A message written before the Electron upgrade. 🌱 鍵 '.repeat(5),
  history: [{ author: 'alice', sequence: 7 }],
  active: true,
}
const purpose = 'quiet-electron-legacy-fixture'
const password = 'public-test-password-not-a-secret'
const signatureContext = 'quiet/electron-upgrade-fixture/v1'
const signer = crypto.signatures.keyPair('public-electron-legacy-signer')
const firstUseDevice = auth.createFirstUseDevice({ deviceName: 'Legacy desktop' })
const device = { ...firstUseDevice, userId: auth.deriveUserId(firstUseDevice.deviceId) }
const user = auth.createUser('Legacy Alice', device.userId)
const context = { user, device }
const team = auth.createTeam('Quiet legacy community 🌱', context)
const fixture = {
  description: `Public test data generated with Node ${process.versions.node} and auth ${commit}. All keys and passwords here are test-only.`,
  payload,
  purpose,
  password,
  signatureContext,
  hash: crypto.hash(purpose, payload),
  publicKey: signer.publicKey,
  signature: crypto.signatures.sign(payload, signer.secretKey, signatureContext),
  cipher: crypto.symmetric.encrypt(payload, password),
  team: { name: team.teamName, context, keys: team.teamKeyring(), chain: Buffer.from(team.save()).toString('base64') },
}
fs.writeFileSync(new URL('legacy-auth.json', import.meta.url), JSON.stringify(fixture, null, 2) + '\n')
