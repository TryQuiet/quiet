// Reproduce the public, deterministic native notification fixture with the pinned auth codecs.
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
    id: 'message-1', channelId: 'channel-1', teamId: 'team-1', userId: 'user-1',
    createdAt: 1700000000000, type: 1, message: 'hello from fixed QSS',
  }
  const value = {
    id: message.id, channelId: message.channelId, teamId: message.teamId, createdAt: message.createdAt,
    contents: encrypt(message, 'inner-role-secret-material', { type: 'ROLE', name: 'MEMBER', generation: 0 }, 0),
    encSignature: {
      signature: bs58.encode(sodium.crypto_sign_detached(pack(['lf/auth/team-message', message]), user.privateKey)),
      author: { type: 'USER', name: message.userId, generation: 0 },
    },
  }
  const fixture = Buffer.from(pack({
    encrypted: encrypt({ payload: { value } }, 'outer-team-secret-material', { type: 'TEAM', name: 'TEAM', generation: 0 }, 24),
  })).toString('base64')

  const target = path.join(__dirname, 'QssPushHandlerTest.kt')
  const source = fs.readFileSync(target, 'utf8')
  assert(source.includes(`USER_PUBLIC_KEY_BASE58 = "${bs58.encode(user.publicKey)}"`))
  const pattern = /(ENCRYPTED_LOG_ENTRY_BASE64 =\s*")[^"]+("\n)/
  assert(pattern.test(source))
  if (process.argv[2] === '--write') {
    fs.writeFileSync(target, source.replace(pattern, `$1${fixture}$2`))
    process.stdout.write('Updated deterministic signed/encrypted native fixture.\n')
  } else {
    assert.equal(process.argv[2], '--check', 'Specify --check or --write')
    assert.equal(pattern.exec(source)[0], `ENCRYPTED_LOG_ENTRY_BASE64 =\n            "${fixture}"\n`)
    process.stdout.write('Native notification fixture matches the pinned auth codecs.\n')
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
