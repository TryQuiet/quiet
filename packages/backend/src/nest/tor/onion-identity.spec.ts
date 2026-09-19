import { fromString } from 'uint8arrays/from-string'
import { createOnionIdentity } from './onion-identity'

describe('local onion identity', () => {
  it('encodes the RFC 8032 Ed25519 test-vector public key as a v3 onion', () => {
    const identity = createOnionIdentity(
      Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex')
    )
    expect(identity.onionAddress).toBe('25njqamcweflpvkl73j4szahhihoc4xt3ktcgjnpaingr5yhkenl5sid.onion')
    const bytes = fromString(identity.onionAddress.replace('.onion', ''), 'base32')
    expect(Buffer.from(bytes.slice(0, 32)).toString('hex')).toBe(
      'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'
    )
    expect(bytes[34]).toBe(3)
    expect(Buffer.from(identity.privateKey.split(':')[1], 'base64')).toHaveLength(64)
  })

  it('generates independent identities and rejects invalid seeds', () => {
    const first = createOnionIdentity()
    const second = createOnionIdentity()
    expect(first).not.toEqual(second)
    expect(() => createOnionIdentity(new Uint8Array(31))).toThrow('32 bytes')
  })
})
