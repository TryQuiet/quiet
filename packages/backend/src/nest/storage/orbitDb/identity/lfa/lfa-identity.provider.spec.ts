import { jest } from '@jest/globals'
import { KeyType } from '@localfirst/crdx'
import { SerializerEncodingType } from '@quiet/types'
import * as uint8arrays from 'uint8arrays'
import { Serializer } from '../../../../common/serializer.service'
import { LFAIdentityProvider } from './lfa-identity.provider'
import { LFAIdentities } from './lfa-identity.service'

describe('LFAIdentityProvider identity binding', () => {
  const teamId = 'team-id'
  const alice = {
    userId: 'alice-id',
    keys: { type: KeyType.USER, name: 'alice-id', generation: 4, signature: 'alice-public-key' },
  }
  const bob = {
    userId: 'bob-id',
    keys: { type: KeyType.USER, name: 'bob-id', generation: 2, signature: 'bob-public-key' },
  }

  const serializer = new Serializer()
  const validateSignature = jest.fn(() => true)
  const sigchain = {
    users: {
      getUserById: jest.fn((userId: string) => {
        if (userId === alice.userId) return alice
        if (userId === bob.userId) return bob
        throw new Error('unknown user')
      }),
    },
    crypto: { validateSignature },
  }
  const sigchainService = {
    getChain: jest.fn((requestedTeamId: string) => {
      if (requestedTeamId !== teamId) throw new Error('unknown team')
      return sigchain
    }),
  }
  const provider = new LFAIdentityProvider(serializer, sigchainService as never)

  const signatureHex = (author: typeof alice | typeof bob): string => {
    const bytes = serializer.serialize(
      {
        teamId,
        signature: 'valid-signature',
        author: {
          type: author.keys.type,
          name: author.userId,
          generation: author.keys.generation,
        },
      },
      SerializerEncodingType.UINT8ARRAY
    )
    return uint8arrays.toString(bytes, 'hex')
  }

  beforeEach(() => validateSignature.mockClear())

  it('rejects a valid Bob envelope when OrbitDB claims Alice as the writer', () => {
    expect(provider.verify(signatureHex(bob), alice.keys.signature, 'entry-bytes')).toBe(false)
    expect(validateSignature).not.toHaveBeenCalled()
  })

  it('verifies an envelope only when signer metadata and the expected identity key agree', () => {
    expect(provider.verify(signatureHex(alice), alice.keys.signature, 'entry-bytes')).toBe(true)
    expect(validateSignature).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: 'entry-bytes',
        author: expect.objectContaining({ name: alice.userId, generation: alice.keys.generation }),
      })
    )
  })

  it('rejects identity metadata that substitutes a key, generation, type, or team', async () => {
    const identity = {
      id: alice.userId,
      teamId,
      type: provider.type,
      generation: alice.keys.generation,
      publicKey: alice.keys.signature,
    }

    await expect(provider.verifyIdentity(identity as never)).resolves.toBe(true)
    await expect(provider.verifyIdentity({ ...identity, publicKey: bob.keys.signature } as never)).resolves.toBe(false)
    await expect(provider.verifyIdentity({ ...identity, generation: 3 } as never)).resolves.toBe(false)
    await expect(provider.verifyIdentity({ ...identity, type: 'other-provider' } as never)).resolves.toBe(false)
    await expect(provider.verifyIdentity({ ...identity, teamId: 'other-team' } as never)).resolves.toBe(false)
  })

  it('passes the claimed OrbitDB identity key into entry-signature verification', async () => {
    const verify = jest.fn(() => true)
    const identities = new LFAIdentities({} as never, { verify } as never, serializer)

    await expect(identities.verify('signature-hex', alice.keys.signature, 'entry-bytes')).resolves.toBe(true)
    expect(verify).toHaveBeenCalledWith('signature-hex', alice.keys.signature, 'entry-bytes')
  })
})
