import { randomUUID, createHash } from 'crypto'
import { asymmetric, symmetric } from '@localfirst/crypto'
import { invitation, lockbox } from '@localfirst/auth'
import { MessageType, type ChannelMessage, type PublicChannel } from '@quiet/types'
import { SigChain } from '../../sigchain'
import { InviteService } from '../invites/invite.service'
import { DeviceService } from '../members/device.service'
import { EncryptionScopeType, type EncryptedAndSignedPayload } from './types'
import type { EncryptedMessage } from '../../../storage/channels/messages/messages.types'

const DOMAIN = 'quiet/direct-message/v1'
const clone = <T>(value: T): T => structuredClone(value)
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const collect = async (stream: AsyncIterable<Uint8Array>) => {
  const result: Uint8Array[] = []
  for await (const chunk of stream) result.push(chunk)
  return result
}
async function* chunks(values: Uint8Array[]) {
  yield* values
}

import { dmFixture, dmMessage } from './direct-message-test-utils'

describe('account-scoped direct message cryptography', () => {
  let fixture: ReturnType<typeof dmFixture>
  beforeAll(() => {
    fixture = dmFixture()
  })

  it('opens on both participants, survives reload, and never grants an ADMIN role access', () => {
    const { admin, bob, carol, eve, channel, descriptor } = fixture
    const plaintext = dmMessage(bob, channel)
    const encrypted = bob.directMessages.sealMessage(plaintext, channel.id)
    expect(carol.directMessages.openMessage(encrypted, channel.id)).toEqual({ ...plaintext, teamId: bob.team!.id })
    expect(channel.roleName).toBeUndefined()
    for (const outsider of [admin, eve]) {
      expect(outsider.directMessages.validateDescriptor(descriptor, channel.id)).toBeDefined()
      expect(outsider.directMessages.openDescriptor(descriptor, channel.id)).toBeUndefined()
      expect(() => outsider.directMessages.openMessage(encrypted, channel.id)).toThrow()
      // Bypass all application checks: neither USER nor any community/ADMIN secret opens the boxes/message.
      const [core, boxes] = JSON.parse(Buffer.from(descriptor.encrypted.contents).toString())
      for (const [, , box] of boxes) {
        expect(() =>
          asymmetric.decryptBytes({
            cipher: Buffer.from(box, 'base64'),
            senderPublicKey: outsider.team!.members(core[3] as string).keys.encryption,
            recipientSecretKey: outsider.user.keys.encryption.secretKey,
          })
        ).toThrow()
      }
      const keymap = outsider.team!.allKeys()
      for (const scopes of Object.values(keymap))
        for (const generations of Object.values(scopes)) {
          for (const keys of Object.values(generations)) {
            expect(() => symmetric.decryptBytes(encrypted.contents.contents, keys.secretKey)).toThrow()
          }
        }
    }
    const reloaded = SigChain.load(carol.save(), carol.localUserContext, carol.team!.teamKeyring())
    reloaded.directMessages.openDescriptor(clone(descriptor), channel.id)
    expect(reloaded.directMessages.openMessage(encrypted, channel.id).message).toBe(plaintext.message)
  })

  it.each([
    [
      'team',
      (x: any) => {
        x[0][2] = 'another-team'
      },
    ],
    [
      'creator',
      (x: any) => {
        x[0][3] = fixture.admin.user.userId
      },
    ],
    [
      'nonce',
      (x: any) => {
        x[0][4] = 'f'.repeat(64)
      },
    ],
    [
      'timestamp',
      (x: any) => {
        x[0][5] += 1
      },
    ],
    [
      'participant',
      (x: any) => {
        x[0][6][0] = fixture.eve.user.userId
      },
    ],
    [
      'duplicate participant',
      (x: any) => {
        x[0][6].push(x[0][6][0])
      },
    ],
    [
      'key commitment',
      (x: any) => {
        x[0][7] = 'e'.repeat(64)
      },
    ],
    [
      'box recipient',
      (x: any) => {
        x[1][0][0] = fixture.eve.user.userId
      },
    ],
    [
      'box generation',
      (x: any) => {
        x[1][0][1] += 1
      },
    ],
    [
      'box ciphertext',
      (x: any) => {
        x[1][0][2] = 'Zm9yZ2Vk'
      },
    ],
    [
      'missing box',
      (x: any) => {
        x[1].pop()
      },
    ],
    [
      'extra field',
      (x: any) => {
        x[0].push('forged')
      },
    ],
  ])('rejects descriptor mutation: %s', (_name, mutate) => {
    const { carol, channel, descriptor } = fixture
    const forged = clone(descriptor)
    const manifest = JSON.parse(Buffer.from(forged.encrypted.contents).toString())
    mutate(manifest)
    forged.encrypted.contents = Buffer.from(JSON.stringify(manifest))
    expect(() => carol.directMessages.openDescriptor(forged, channel.id)).toThrow()
    expect(carol.directMessages.channel(channel.id)).toEqual(channel)
  })

  it('rejects a creator-signed descriptor whose recipient box belongs to another core', () => {
    const { bob, carol, descriptor } = fixture
    const forged = clone(descriptor)
    const manifest = JSON.parse(Buffer.from(forged.encrypted.contents).toString())
    manifest[0][4] = 'a'.repeat(64)
    const id = 'dm_' + hash([DOMAIN, 'channel', manifest])
    forged.encrypted.contents = Buffer.from(JSON.stringify(manifest))
    forged.encrypted.scope.name = id
    const signed = bob.crypto.sign([DOMAIN, 'descriptor', id, manifest])
    forged.signature = { author: signed.author, signature: signed.signature }
    expect(carol.directMessages.validateDescriptor(forged, id)).toBeDefined()
    expect(() => carol.directMessages.openDescriptor(forged, id)).toThrow()
    expect(carol.directMessages.has(id)).toBe(false)
  })

  it.each([
    [
      'id',
      (x: EncryptedMessage) => {
        x.id += 'changed'
      },
    ],
    [
      'timestamp',
      (x: EncryptedMessage) => {
        x.createdAt += 1
      },
    ],
    [
      'team',
      (x: EncryptedMessage) => {
        x.teamId = 'another-team'
      },
    ],
    [
      'channel',
      (x: EncryptedMessage) => {
        x.channelId = 'another-channel'
      },
    ],
    [
      'author',
      (x: EncryptedMessage) => {
        x.encSignature.author.name = fixture.carol.user.userId
      },
    ],
    [
      'author type',
      (x: EncryptedMessage) => {
        x.encSignature.author.type = 'ROLE'
      },
    ],
    [
      'generation',
      (x: EncryptedMessage) => {
        x.encSignature.author.generation += 1
      },
    ],
    [
      'scope type',
      (x: EncryptedMessage) => {
        x.contents.scope.type = EncryptionScopeType.ROLE
      },
    ],
    [
      'scope name',
      (x: EncryptedMessage) => {
        x.contents.scope.name = 'MEMBER'
      },
    ],
    [
      'scope generation',
      (x: EncryptedMessage) => {
        x.contents.scope.generation = 1
      },
    ],
    [
      'ciphertext',
      (x: EncryptedMessage) => {
        x.contents.contents[10] ^= 1
      },
    ],
  ])('rejects message mutation: %s', (_name, mutate) => {
    const { bob, carol, channel } = fixture
    const forged = clone(bob.directMessages.sealMessage(dmMessage(bob, channel), channel.id))
    mutate(forged)
    expect(() => carol.directMessages.openMessage(forged, channel.id)).toThrow()
  })

  it('rejects cross-conversation replay and a participant using another author’s message id', () => {
    const { bob, carol, channel } = fixture
    const message = dmMessage(bob, channel)
    const encrypted = bob.directMessages.sealMessage(message, channel.id)
    const second = bob.directMessages.create([carol.user.userId])
    carol.directMessages.openDescriptor(bob.directMessages.descriptor(second.id), second.id)
    expect(() => carol.directMessages.openMessage(encrypted, second.id)).toThrow()
    expect(() => carol.directMessages.sealMessage({ ...message, userId: carol.user.userId }, channel.id)).toThrow()
  })

  it('decrypts attachments only for participants and rejects truncated, altered and reordered streams', async () => {
    const { bob, carol, eve, channel } = fixture
    const content = [Buffer.from('private first block'), Buffer.from('private second block')]
    const encrypted = bob.directMessages.encryptStream(chunks(content), channel.id)
    const cipher = await collect(encrypted.encryptStream)
    const decrypt = (data: Uint8Array[]) =>
      collect(carol.directMessages.decryptStream(chunks(data), encrypted.header, channel.id))
    expect(Buffer.concat(await decrypt(cipher))).toEqual(Buffer.concat(content))
    expect(() => eve.directMessages.decryptStream(chunks(cipher), encrypted.header, channel.id)).toThrow()
    const corrupt = cipher.map(x => Uint8Array.from(x))
    corrupt[0][0] ^= 1
    for (const attack of [cipher.slice(0, -1), [], [...cipher].reverse(), [...cipher, cipher[0]], corrupt]) {
      await expect(decrypt(attack)).rejects.toThrow()
    }
  })

  it('admits a new account device, recovers its keys from the invitation, and reads earlier DM history', () => {
    const { bob, carol, channel, descriptor } = fixture
    const earlier = bob.directMessages.sealMessage(dmMessage(bob, channel), channel.id)
    const { seed } = carol.invites.createDeviceInvite()
    const phone = DeviceService.generateDeviceForUser(carol.user.userId)
    carol.invites.admitDeviceFromInvite(InviteService.createDeviceAdmission({ seed, device: phone }))
    const starter = invitation.generateStarterKeys(seed)
    const delivery = carol.team!.state.lockboxes.find(x => x.recipient.publicKey === starter.encryption.publicKey)!
    expect(delivery).toBeDefined()
    const recoveredKeys = (lockbox as { open: typeof import('@localfirst/auth/lockbox/open').open }).open(
      delivery,
      starter
    )
    const linked = SigChain.load(
      carol.save(),
      {
        device: phone,
        user: { userId: carol.user.userId, userName: carol.user.userName, keys: recoveredKeys },
      },
      carol.team!.teamKeyring()
    )
    linked.team!.join(carol.team!.teamKeyring())
    expect(linked.team!.hasDevice(phone.deviceId)).toBe(true)
    linked.directMessages.openDescriptor(descriptor, channel.id)
    expect(linked.directMessages.openMessage(earlier, channel.id).message).toContain('Confidential DM')
    expect(
      bob.directMessages.openMessage(
        linked.directMessages.sealMessage(dmMessage(linked, channel), channel.id),
        channel.id
      ).userId
    ).toBe(carol.user.userId)
    expect(() => carol.team!.removeDevice(phone.deviceId)).toThrow(/disabled/i)
  })
})
