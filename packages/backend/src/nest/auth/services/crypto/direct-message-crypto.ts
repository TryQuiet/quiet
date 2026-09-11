import { createHash, randomBytes } from 'crypto'
import { asymmetric, randomKey, symmetric } from '@localfirst/crypto'
import { ChannelType, type ChannelMessage, type PublicChannel } from '@quiet/types'
import type { Base58 } from '@localfirst/crypto'
import { isConsumedChannelMessage } from '../../../validation/validators'
import type { SigChain } from '../../sigchain'
import { EncryptionScopeType, type EncryptedAndSignedPayload } from './types'
import type { EncryptedMessage } from '../../../storage/channels/messages/messages.types'

const DOMAIN = 'quiet/direct-message/v1'
export const MAX_DM_PARTICIPANTS = 16
const MAX_DESCRIPTOR_BYTES = 64 * 1024
const MAX_MESSAGE_BYTES = 2 * 1024 * 1024
type Core = [string, number, string, string, string, number, string[], string]
type RecipientBox = [string, number, string]
type Manifest = [Core, RecipientBox[]]
type RegisteredDm = { channel: PublicChannel; key: string; descriptor: EncryptedAndSignedPayload }

const digest = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const requireValid: (value: unknown) => asserts value = value => {
  if (!value) throw new Error('Invalid direct message')
}
const text = (value: unknown, max = 256): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max

/** Decode only the wire encodings used by OrbitDB/QSS; never interpolate secret data into errors. */
export function dmBytes(value: unknown, maximum: number): Uint8Array {
  let result: Uint8Array
  if (value instanceof Uint8Array) result = value
  else if (typeof value === 'string' && value.length <= maximum * 2) result = Buffer.from(value, 'base64')
  else if (Array.isArray(value) && value.length <= maximum) {
    requireValid(value.every(x => Number.isInteger(x) && x >= 0 && x <= 255))
    result = Uint8Array.from(value)
  } else if (value && typeof value === 'object' && (value as any).type === 'Buffer') {
    return dmBytes((value as any).data, maximum)
  } else throw new Error('Invalid direct message bytes')
  requireValid(result.length > 0 && result.length <= maximum)
  return result
}

/**
 * DM keys are account-to-account deliveries, never LFA role keys (which admins can read).
 * Only encrypted, immutable descriptors persist. Each device rebuilds this private registry
 * by opening its account's box. Nothing returned to the frontend contains a secret key.
 */
export class DirectMessageCrypto {
  private readonly registered = new Map<string, RegisteredDm>()

  constructor(private readonly chain: SigChain) {}

  private members(ids: unknown): asserts ids is string[] {
    requireValid(Array.isArray(ids) && ids.length > 0 && ids.length <= MAX_DM_PARTICIPANTS)
    requireValid(ids.every(id => text(id) && this.chain.team!.has(id)))
    requireValid(JSON.stringify(ids) === JSON.stringify([...new Set(ids)].sort()))
  }

  public create(memberIds: string[]): PublicChannel {
    const ids = [...new Set([...memberIds, this.chain.user.userId])].sort()
    this.members(ids)
    const key = randomKey(32)
    const core: Core = [
      DOMAIN,
      1,
      this.chain.team!.id,
      this.chain.user.userId,
      randomBytes(32).toString('hex'),
      Date.now(),
      ids,
      digest([DOMAIN, 'key', key]),
    ]
    const coreId = digest(core)
    const boxes: RecipientBox[] = ids.map(id => {
      const keys = this.chain.team!.members(id).keys
      const secret = [DOMAIN, 'key-box', coreId, id, keys.generation, key, core[7]]
      const cipher = asymmetric.encryptBytes({
        secret,
        recipientPublicKey: keys.encryption,
        senderSecretKey: this.chain.user.keys.encryption.secretKey,
      })
      return [id, keys.generation, Buffer.from(cipher).toString('base64')]
    })
    const manifest: Manifest = [core, boxes]
    const id = 'dm_' + digest([DOMAIN, 'channel', manifest])
    const signed = this.chain.crypto.sign([DOMAIN, 'descriptor', id, manifest])
    const descriptor: EncryptedAndSignedPayload = {
      encrypted: {
        contents: Buffer.from(JSON.stringify(manifest)),
        scope: { type: EncryptionScopeType.DM_DESCRIPTOR, name: id, generation: 0 },
      },
      signature: { author: signed.author, signature: signed.signature },
      userId: core[3],
      teamId: core[2],
      ts: core[5],
    }
    return this.openDescriptor(descriptor, id)!
  }

  /** Public verification is possible even on replicas that cannot decrypt this DM. */
  public validateDescriptor(envelope: EncryptedAndSignedPayload, expectedId: string): Manifest {
    requireValid(envelope && envelope.encrypted && envelope.signature)
    const { scope } = envelope.encrypted
    requireValid(scope.type === EncryptionScopeType.DM_DESCRIPTOR && scope.generation === 0)
    requireValid(scope.name === expectedId && /^dm_[a-f0-9]{64}$/.test(expectedId))
    const bytes = dmBytes(envelope.encrypted.contents, MAX_DESCRIPTOR_BYTES)
    const manifest = JSON.parse(Buffer.from(bytes).toString('utf8')) as Manifest
    requireValid(Array.isArray(manifest) && manifest.length === 2)
    const [core, boxes] = manifest
    requireValid(Array.isArray(core) && core.length === 8)
    requireValid(core[0] === DOMAIN && core[1] === 1 && core[2] === this.chain.team!.id)
    requireValid(text(core[3]) && text(core[4]) && /^[a-f0-9]{64}$/.test(core[4]))
    requireValid(Number.isSafeInteger(core[5]) && core[5] >= 0 && text(core[7]) && /^[a-f0-9]{64}$/.test(core[7]))
    this.members(core[6])
    requireValid(core[6].includes(core[3]))
    requireValid(Array.isArray(boxes) && boxes.length === core[6].length)
    boxes.forEach((box, i) => {
      requireValid(Array.isArray(box) && box.length === 3 && box[0] === core[6][i])
      const keys = this.chain.team!.members(box[0]).keys
      requireValid(Number.isSafeInteger(box[1]) && box[1] === keys.generation)
      requireValid(text(box[2], 8192) && /^[A-Za-z0-9+/]+={0,2}$/.test(box[2]))
    })
    requireValid('dm_' + digest([DOMAIN, 'channel', manifest]) === expectedId)
    requireValid(envelope.teamId === core[2] && envelope.userId === core[3] && envelope.ts === core[5])
    requireValid(envelope.signature.author.type === 'USER' && envelope.signature.author.name === core[3])
    requireValid(envelope.signature.author.generation === this.chain.team!.members(core[3]).keys.generation)
    requireValid(
      this.chain.crypto.validateSignature({
        ...envelope.signature,
        contents: [DOMAIN, 'descriptor', expectedId, manifest],
      })
    )
    return manifest
  }

  public openDescriptor(envelope: EncryptedAndSignedPayload, expectedId: string): PublicChannel | undefined {
    const [core, boxes] = this.validateDescriptor(envelope, expectedId)
    const box = boxes.find(x => x[0] === this.chain.user.userId)
    if (!box) return undefined
    const opened = asymmetric.decryptBytes({
      cipher: Buffer.from(box[2], 'base64'),
      senderPublicKey: this.chain.team!.members(core[3]).keys.encryption,
      recipientSecretKey: this.chain.user.keys.encryption.secretKey,
    })
    requireValid(Array.isArray(opened) && opened.length === 7)
    requireValid(opened[0] === DOMAIN && opened[1] === 'key-box' && opened[2] === digest(core))
    requireValid(opened[3] === box[0] && opened[4] === box[1] && text(opened[5]))
    requireValid(opened[6] === core[7] && digest([DOMAIN, 'key', opened[5]]) === core[7])
    const channel: PublicChannel = {
      id: expectedId,
      teamId: core[2],
      owner: core[3],
      timestamp: core[5],
      name: 'Direct message',
      description: 'Direct message',
      public: false,
      type: ChannelType.DM,
      memberIds: [...core[6]],
    }
    this.registered.set(expectedId, { channel, key: opened[5], descriptor: structuredClone(envelope) })
    return structuredClone(channel)
  }

  public descriptor(channelId: string): EncryptedAndSignedPayload {
    return structuredClone(this.entry(channelId).descriptor)
  }

  public has(channelId: string): boolean {
    return this.registered.has(channelId)
  }

  public channel(channelId: string): PublicChannel {
    return structuredClone(this.entry(channelId).channel)
  }

  private entry(channelId: string): RegisteredDm {
    const entry = this.registered.get(channelId)
    requireValid(entry && entry.channel.teamId === this.chain.team!.id)
    requireValid(entry.channel.memberIds!.includes(this.chain.user.userId))
    return entry
  }

  private messageTranscript(message: EncryptedMessage): unknown[] {
    return [
      DOMAIN,
      'message',
      message.teamId,
      message.channelId,
      message.id,
      message.createdAt,
      message.encSignature.author.name,
      message.encSignature.author.generation,
      message.contents.scope.type,
      message.contents.scope.name,
      message.contents.scope.generation,
      Buffer.from(dmBytes(message.contents.contents, MAX_MESSAGE_BYTES)).toString('base64'),
    ]
  }

  public sealMessage(message: ChannelMessage, channelId: string): EncryptedMessage {
    const entry = this.entry(channelId)
    requireValid(message.userId === this.chain.user.userId && message.channelId === channelId)
    requireValid(text(message.id, 512) && message.id.startsWith(message.userId + ':'))
    const body = { ...message, teamId: this.chain.team!.id, dmDomain: DOMAIN, dmKeyId: channelId }
    delete body.encSignature
    const encrypted: EncryptedMessage = {
      id: message.id,
      teamId: this.chain.team!.id,
      channelId,
      createdAt: message.createdAt,
      contents: {
        contents: symmetric.encryptBytes(body, entry.key),
        scope: { type: EncryptionScopeType.DM, name: channelId, generation: 0 },
      },
      encSignature: {
        author: { type: 'USER', name: message.userId, generation: this.chain.user.keys.generation },
        signature: '' as Base58,
      },
    }
    const signature = this.chain.crypto.sign(this.messageTranscript(encrypted))
    encrypted.encSignature = { author: signature.author, signature: signature.signature }
    return encrypted
  }

  public openMessage(message: EncryptedMessage, channelId: string): ChannelMessage & { teamId: string } {
    const entry = this.entry(channelId)
    requireValid(message.teamId === entry.channel.teamId && message.channelId === channelId)
    requireValid(message.contents.scope.type === EncryptionScopeType.DM)
    requireValid(message.contents.scope.name === channelId && message.contents.scope.generation === 0)
    requireValid(message.encSignature.author.type === 'USER')
    requireValid(text(message.id, 512) && message.id.startsWith(message.encSignature.author.name + ':'))
    requireValid(entry.channel.memberIds!.includes(message.encSignature.author.name))
    requireValid(
      message.encSignature.author.generation ===
        this.chain.team!.members(message.encSignature.author.name).keys.generation
    )
    requireValid(
      this.chain.crypto.validateSignature({
        ...message.encSignature,
        contents: this.messageTranscript(message),
      })
    )
    const body = symmetric.decryptBytes(dmBytes(message.contents.contents, MAX_MESSAGE_BYTES), entry.key) as any
    requireValid(body && body.dmDomain === DOMAIN && body.dmKeyId === channelId)
    requireValid(body.teamId === message.teamId && body.channelId === channelId && body.id === message.id)
    requireValid(body.createdAt === message.createdAt && body.userId === message.encSignature.author.name)
    const { dmDomain: _domain, dmKeyId: _keyId, ...plaintext } = body
    requireValid(isConsumedChannelMessage({ ...plaintext, encSignature: message.encSignature, verified: true }))
    if (plaintext.media != null) {
      requireValid(plaintext.media.message.id === plaintext.id && plaintext.media.message.channelId === channelId)
      requireValid(plaintext.media.enc?.recipient.type === EncryptionScopeType.DM)
      requireValid(plaintext.media.enc.recipient.name === channelId && plaintext.media.enc.recipient.generation === 0)
    }
    return plaintext
  }

  public encryptStream(stream: AsyncIterable<Uint8Array>, channelId: string) {
    const entry = this.entry(channelId)
    return {
      ...symmetric.encryptBytesStream(stream, entry.key),
      recipient: { type: EncryptionScopeType.DM, name: channelId, generation: 0 },
    }
  }

  public decryptStream(stream: AsyncIterable<Uint8Array>, header: Uint8Array, channelId: string) {
    return symmetric.decryptBytesStream(stream, header, this.entry(channelId).key)
  }
}
