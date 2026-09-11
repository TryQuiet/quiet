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

  const deviceKey = (chain: SigChain) => chain.device.keys.signature.publicKey

  const identityFor = (
    provider: LFAIdentityProvider,
    chain: SigChain,
    overrides: Partial<LFAIdentityMetadata> = {}
  ) => {
    const metadata: LFAIdentityMetadata = {
      id: chain.user.userId,
      deviceId: chain.device.deviceId,
      teamId: chain.team!.id,
      publicKey: deviceKey(chain),
      ...overrides,
    }
    const bytes = serializer.serialize(metadata, SerializerEncodingType.UINT8ARRAY)
    return { ...metadata, type: provider.type, bytes, hash: uint8arrays.toString(bytes, 'hex') }
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
    const entryBytes = 'entry-bytes'
    const bobSignature = providerFor(bob).sign(bob.user.userId, bob.team!.id, entryBytes)

    expect(aliceProvider.verify(bobSignature, deviceKey(alice), entryBytes)).toBe(false)
    expect(aliceProvider.verify(bobSignature, deviceKey(bob), entryBytes)).toBe(true)
    expect(aliceProvider.verify(bobSignature, deviceKey(bob), `${entryBytes}-tampered`)).toBe(false)
  })

  it('binds the identity to the device registered for the claimed user', async () => {
    const alice = SigChain.create()
    const bob = addBob(alice)
    const provider = providerFor(alice)

    await expect(provider.verifyIdentity(identityFor(provider, alice) as never)).resolves.toBe(true)
    await expect(provider.verifyIdentity(identityFor(provider, bob) as never)).resolves.toBe(true)
    await expect(
      provider.verifyIdentity(identityFor(provider, alice, { publicKey: 'substituted-key' as never }) as never)
    ).resolves.toBe(false)
    await expect(
      provider.verifyIdentity(identityFor(provider, alice, { teamId: 'other-team' }) as never)
    ).resolves.toBe(false)
    await expect(
      provider.verifyIdentity({ ...identityFor(provider, alice), type: 'other-provider' } as never)
    ).resolves.toBe(false)
    // Bob's own device and key, presented under Alice's user ID: the device is registered, but not to Alice
    await expect(provider.verifyIdentity(identityFor(provider, bob, { id: alice.user.userId }) as never)).resolves.toBe(
      false
    )
  })

  it('keeps verifying identities and entries when user key rotation is refused', async () => {
    const alice = SigChain.create()
    const provider = providerFor(alice)
    const identity = identityFor(provider, alice)
    const oldSignature = provider.sign(alice.user.userId, alice.team!.id, 'old-entry')

    expect(() => alice.team!.changeKeys(createKeyset({ type: KeyType.USER, name: alice.user.userId }))).toThrow(
      /removal and key rotation are disabled/i
    )
    const newSignature = provider.sign(alice.user.userId, alice.team!.id, 'new-entry')

    // The refused operation must not invalidate existing identities or signatures.
    expect(identityFor(provider, alice)).toEqual(identity)
    await expect(provider.verifyIdentity(identity as never)).resolves.toBe(true)
    expect(provider.verify(oldSignature, identity.publicKey, 'old-entry')).toBe(true)
    expect(provider.verify(newSignature, identity.publicKey, 'new-entry')).toBe(true)
  })

  it('keeps verifying identities and entries when device and member removal are refused', async () => {
    const alice = SigChain.create()
    const bob = addBob(alice)
    const provider = providerFor(alice)
    const bobIdentity = identityFor(provider, bob)
    const bobSignature = providerFor(bob).sign(bob.user.userId, bob.team!.id, 'entry-bytes')

    expect(() => alice.team!.removeDevice(bob.device.deviceId)).toThrow(/removal and key rotation are disabled/i)
    await expect(provider.verifyIdentity(bobIdentity as never)).resolves.toBe(true)
    expect(provider.verify(bobSignature, bobIdentity.publicKey, 'entry-bytes')).toBe(true)

    expect(() => alice.team!.remove(bob.user.userId)).toThrow(/removal and key rotation are disabled/i)
    await expect(provider.verifyIdentity(bobIdentity as never)).resolves.toBe(true)
  })

  it('passes the claimed OrbitDB identity key into entry-signature verification', async () => {
    const verify = jest.fn(() => true)
    const identities = new LFAIdentities({} as never, { verify } as never, serializer)

    await expect(identities.verify('signature-hex', 'claimed-key', 'entry-bytes')).resolves.toBe(true)
    expect(verify).toHaveBeenCalledWith('signature-hex', 'claimed-key', 'entry-bytes')
  })
})
