// Reproduce the public NSE integration fixture using the pinned auth codecs.
// From any directory: node <this file> --check (or --write after a protocol change).
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')

let root = __dirname
while (!fs.existsSync(path.join(root, '3rd-party/auth/packages/crypto/package.json'))) {
  const parent = path.dirname(root)
  if (parent === root) throw new Error('Initialize the pinned auth submodule first')
  root = parent
}
const authRequire = createRequire(path.join(root, '3rd-party/auth/packages/crypto/package.json'))
const sodium = authRequire('libsodium-wrappers-sumo')
const { Packr } = authRequire('msgpackr')
const bs58 = authRequire('bs58')
const packer = new Packr({ useRecords: false })
const pack = value => packer.pack(value)

async function main() {
  await sodium.ready
  const user = sodium.crypto_sign_seed_keypair(Uint8Array.from({ length: 32 }, (_, i) => i + 32))
  const salt = bs58.decode('H5B4DLSXw5xwNYFdz1Wr6e')
  const encrypt = (value, password, scope, nonceStart) => {
    const key = sodium.crypto_generichash(32, password, salt)
    const nonce = Uint8Array.from({ length: 24 }, (_, i) => i + nonceStart)
    const plaintext = Buffer.from(pack(value))
    const encrypted = sodium.crypto_secretbox_detached(plaintext, nonce, key)
    assert(encrypted.cipher instanceof Uint8Array)
    assert.deepEqual(Buffer.from(sodium.crypto_secretbox_open_easy(Buffer.concat([encrypted.mac, encrypted.cipher]), nonce, key)), plaintext)
    const tag = sodium.crypto_auth(Buffer.concat([nonce, encrypted.mac]), key)
    return {
      contents: pack({ nonce, tag, message: encrypted.cipher, mac: encrypted.mac }),
      scope,
    }
  }
  const message = {
    id: 'message-1', channelId: 'channel-security', teamId: 'team-test-1', userId: 'user-alice',
    createdAt: 1700000000000, type: 1, message: 'Authenticated background message',
  }
  const value = {
    id: message.id, channelId: message.channelId, teamId: message.teamId, createdAt: message.createdAt,
    contents: encrypt(message, '0123456789abcdef0123456789abcdef', { type: 'TEAM', name: 'TEAM', generation: 0 }, 0),
    encSignature: {
      signature: bs58.encode(sodium.crypto_sign_detached(pack(['lf/auth/team-message', message]), user.privateKey)),
      author: { type: 'USER', name: message.userId, generation: 0 },
    },
  }
  const fixture = Buffer.from(pack({
    encrypted: encrypt({ payload: { value } }, '0123456789abcdef0123456789abcdef', { type: 'TEAM', name: 'TEAM', generation: 0 }, 24),
  })).toString('hex')

  const target = path.join(__dirname, 'NSEAuthProtocolTests.swift')
  const source = fs.readFileSync(target, 'utf8')
  const pattern = /(private static let encryptedLogEntry = Data\(hex:\n)[\s\S]*?(\n    \))/
  assert(pattern.test(source))
  const encoded = fixture.match(/.{1,96}/g).map(chunk => `        "${chunk}"`).join(' +\n')
  const keyPattern = /(case "quiet_team-test-1_USER_user-alice_0_userSig":\n            return ")[^"]+("\n)/
  assert(keyPattern.test(source))
  const updated = source.replace(pattern, `$1${encoded}$2`).replace(keyPattern, `$1${bs58.encode(user.publicKey)}$2`)
  if (process.argv[2] === '--write') {
    fs.writeFileSync(target, updated)
    process.stdout.write('Updated deterministic signed/encrypted NSE fixture.\n')
  } else {
    assert.equal(process.argv[2], '--check', 'Specify --check or --write')
    assert.equal(source, updated, 'NSE fixture must match its reproducible current-protocol encoding')
    process.stdout.write('NSE fixture matches the pinned auth codecs.\n')
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
