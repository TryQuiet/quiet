import { jest } from '@jest/globals'
import { createKeyset, KeyType } from '@localfirst/crdx'
import { SerializerEncodingType } from '@quiet/types'
import * as uint8arrays from 'uint8arrays'
import { SigChain } from '../../../../auth/sigchain'
import { InviteService } from '../../../../auth/services/invites/invite.service'
import { UserService } from '../../../../auth/services/members/user.service'
import { Serializer } from '../../../../common/serializer.service'
import { LFAIdentityProvider } from './lfa-identity.provider'
import { LFAIdentities } from './lfa-identity.service'
import { LFAIdentityMetadata } from './types'

describe('LFAIdentityProvider identity binding', () => {
  const serializer = new Serializer()

  const providerFor = (chain: SigChain) =>
    new LFAIdentityProvider(serializer, {
      getChain: (teamId: string) => {
        if (teamId !== chain.team!.id) throw new Error('unknown team')
        return chain
      },
    } as never)

  const publicSigningKey = (chain: SigChain) => chain.users.getUserById(chain.user.userId).keys.signature

  const identityFor = (provider: LFAIdentityProvider, chain: SigChain, publicKey = publicSigningKey(chain)) => {
    const metadata: LFAIdentityMetadata = {
      id: chain.user.userId,
      teamId: chain.team!.id,
      type: provider.type,
      publicKey,
      generation: chain.user.keys.generation,
    }
    const bytes = serializer.serialize(metadata, SerializerEncodingType.UINT8ARRAY)
    return { ...metadata, bytes, hash: uint8arrays.toString(bytes, 'hex') }
  }

  const addBob = (alice: SigChain): SigChain => {
    const invite = alice.invites.createUserInvite()
    const bobContext = UserService.createFromInviteSeed({ seed: invite.seed })
    alice.invites.admitMemberFromInvite(InviteService.createMemberAdmission({ seed: invite.seed, context: bobContext }))
    return SigChain.joinForTesting(bobContext, alice.team!.save(), alice.team!.teamKeyring())
  }

  it('rejects a valid Bob envelope when OrbitDB claims Alice as the writer', () => {
    const alice = SigChain.create()
    const bob = addBob(alice)
    const aliceProvider = providerFor(alice)
    const bobProvider = providerFor(bob)
    const entryBytes = 'entry-bytes'
    const bobSignature = bobProvider.sign(bob.user.userId, bob.team!.id, entryBytes)

    expect(aliceProvider.verify(bobSignature, publicSigningKey(alice), entryBytes)).toBe(false)
    expect(aliceProvider.verify(bobSignature, publicSigningKey(bob), entryBytes)).toBe(true)
  })

  it('binds the complete canonical identity metadata to its hash', async () => {
    const alice = SigChain.create()
    const provider = providerFor(alice)
    const identity = identityFor(provider, alice)
    await expect(provider.verifyIdentity(identity as never)).resolves.toBe(true)
    await expect(provider.verifyIdentity({ ...identity, publicKey: 'substituted-key' } as never)).resolves.toBe(false)
    await expect(provider.verifyIdentity({ ...identity, generation: identity.generation + 1 } as never)).resolves.toBe(
      false
    )
    await expect(provider.verifyIdentity({ ...identity, type: 'other-provider' } as never)).resolves.toBe(false)
    await expect(provider.verifyIdentity({ ...identity, teamId: 'other-team' } as never)).resolves.toBe(false)
  })

  it('continues verifying identities and entries created before a legitimate key rotation', async () => {
    const alice = SigChain.create()
    const provider = providerFor(alice)
    const oldIdentity = identityFor(provider, alice)
    const oldSignature = provider.sign(alice.user.userId, alice.team!.id, 'old-entry')

    alice.team!.changeKeys(createKeyset({ type: KeyType.USER, name: alice.user.userId }))
    const newIdentity = identityFor(provider, alice)
    const newSignature = provider.sign(alice.user.userId, alice.team!.id, 'new-entry')

    await expect(provider.verifyIdentity(oldIdentity as never)).resolves.toBe(true)
    expect(provider.verify(oldSignature, oldIdentity.publicKey, 'old-entry')).toBe(true)
    await expect(provider.verifyIdentity(newIdentity as never)).resolves.toBe(true)
    expect(provider.verify(newSignature, newIdentity.publicKey, 'new-entry')).toBe(true)
  })

  it('passes the claimed OrbitDB identity key into entry-signature verification', async () => {
    const verify = jest.fn(() => true)
    const identities = new LFAIdentities({} as never, { verify } as never, serializer)

    await expect(identities.verify('signature-hex', 'claimed-key', 'entry-bytes')).resolves.toBe(true)
    expect(verify).toHaveBeenCalledWith('signature-hex', 'claimed-key', 'entry-bytes')
  })
})
