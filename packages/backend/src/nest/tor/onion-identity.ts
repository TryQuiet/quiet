import { createHash, createPrivateKey, createPublicKey, randomBytes } from 'crypto'
import { sha3_256 } from '@noble/hashes/sha3'
import { toString } from 'uint8arrays/to-string'

/** Generate an identity without starting Tor or contacting the network. */
export function createOnionIdentity(seed: Uint8Array = randomBytes(32)): {
  onionAddress: string
  privateKey: string
} {
  if (seed.length !== 32) throw new Error('An Ed25519 seed must be 32 bytes')
  const key = createPrivateKey({
    // RFC 8410 PKCS#8 Ed25519 private key containing the 32-byte seed.
    key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
    format: 'der',
    type: 'pkcs8',
  })
  const publicKey = createPublicKey(key).export({ format: 'jwk' })
  const publicBytes = Buffer.from(publicKey.x!, 'base64url')
  // ADD_ONION ED25519-V3 expects the expanded scalar + PRF secret, not the seed.
  // https://spec.torproject.org/control-spec/commands.html#add_onion
  const expanded = createHash('sha512').update(seed).digest()
  expanded[0] &= 248
  expanded[31] &= 63
  expanded[31] |= 64
  const version = Buffer.from([3])
  // https://spec.torproject.org/rend-spec/encoding-onion-addresses.html
  // Electron's BoringSSL doesn't expose SHA-3 through node:crypto.
  const checksum = sha3_256(Buffer.concat([Buffer.from('.onion checksum'), publicBytes, version]))
  const address = toString(Buffer.concat([publicBytes, checksum.subarray(0, 2), version]), 'base32')
  return { onionAddress: `${address}.onion`, privateKey: `ED25519-V3:${expanded.toString('base64')}` }
}
