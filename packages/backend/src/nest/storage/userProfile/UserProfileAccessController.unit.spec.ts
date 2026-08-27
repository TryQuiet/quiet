import { describe, expect, it, jest } from '@jest/globals'
import { type LogEntry } from '@orbitdb/core'
import { UserProfile } from '@quiet/types'
import { base58btc } from 'multiformats/bases/base58'

import { UserProfileAccessController } from './UserProfileAccessController'
import { RoleName } from '../../auth/services/roles/roles'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../auth/services/crypto/types'
import { OrbitDbOp } from '../orbitDb/orbitdb.types'

const emptyAsyncIterable = async function* () {}

const createInMemoryIpfs = () => {
  const blocks = new Map<string, Uint8Array>()
  const cidKey = (cid: any): string => cid.toString(base58btc)

  return {
    blockstore: {
      put: async (cid: any, bytes: Uint8Array) => {
        blocks.set(cidKey(cid), bytes)
      },
      get: async (cid: any) => blocks.get(cidKey(cid)),
    },
    pins: {
      isPinned: async () => false,
      add: () => emptyAsyncIterable(),
    },
  }
}

const createUserProfile = (userId = 'writer-id', overrides: Partial<UserProfile> = {}): UserProfile => ({
  userId,
  nickname: 'Writer',
  ...overrides,
})

const createSigchainService = ({
  teamId = 'team-id',
  member = true,
  admin = false,
  decryptedProfile = createUserProfile(),
  signatureIsValid = true,
  decryptThrows = false,
}: {
  teamId?: string
  member?: boolean
  admin?: boolean
  decryptedProfile?: UserProfile
  signatureIsValid?: boolean
  decryptThrows?: boolean
} = {}) =>
  ({
    getActiveChain: jest.fn().mockReturnValue({
      team: { id: teamId },
      roles: {
        memberHasRole: jest.fn(
          (memberId: string, roleName: string) => memberId === 'writer-id' && roleName === RoleName.MEMBER && member
        ),
        memberIsAdmin: jest.fn((memberId: string) => memberId === 'writer-id' && admin),
      },
      crypto: {
        decryptAndVerify: jest.fn(() => {
          if (decryptThrows) {
            throw new Error('decrypt failed')
          }
          return {
            contents: decryptedProfile,
            isValid: signatureIsValid,
          }
        }),
      },
    }),
  }) as any

const createEncryptedPayload = ({
  userId = 'writer-id',
  sigAuthor = userId,
  teamId = 'team-id',
}: {
  userId?: string
  sigAuthor?: string
  teamId?: string
} = {}): EncryptedAndSignedPayload =>
  ({
    encrypted: {
      contents: new Uint8Array([1, 2, 3]),
      scope: {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
        generation: 0,
      },
    },
    signature: {
      signature: 'signature',
      author: { name: sigAuthor },
    },
    ts: 1,
    userId,
    teamId,
  }) as unknown as EncryptedAndSignedPayload

const createEntry = ({
  op = OrbitDbOp.PUT,
  key = 'writer-id',
  hash = `put-${key}`,
  value = createEncryptedPayload(),
  includeValue = true,
}: {
  op?: OrbitDbOp
  key?: string
  hash?: string
  value?: EncryptedAndSignedPayload
  includeValue?: boolean
} = {}): LogEntry<EncryptedAndSignedPayload> =>
  ({
    hash,
    identity: 'writer-identity-hash',
    payload: {
      op,
      key,
      value: includeValue ? value : undefined,
    },
  }) as unknown as LogEntry<EncryptedAndSignedPayload>

const createAccess = async (
  sigchainService: any,
  writerIdentity: { id: string; teamId?: string } | undefined = { id: 'writer-id', teamId: 'team-id' },
  verifyIdentity = true
) => {
  const controller = new UserProfileAccessController(sigchainService)
  const factory = controller.createAccessControllerFunc({ write: ['*'], sigchainService })
  return (factory as any)({
    orbitdb: {
      identity: { id: 'local-orbitdb-identity' },
      ipfs: createInMemoryIpfs(),
    },
    identities: {
      getIdentity: jest.fn().mockResolvedValue(writerIdentity as never),
      verifyIdentity: jest.fn().mockResolvedValue(verifyIdentity as never),
    },
  })
}

describe('UserProfileAccessController', () => {
  it('loads the ACL manifest from a persisted typed access-controller address', async () => {
    const sigchainService = createSigchainService()
    const controller = new UserProfileAccessController(sigchainService)
    const factory = controller.createAccessControllerFunc({ write: ['writer-id'], sigchainService })
    const orbitdb = {
      identity: { id: 'local-orbitdb-identity' },
      ipfs: createInMemoryIpfs(),
    }
    const identities = {}

    const created = await (factory as any)({ orbitdb, identities })
    expect(created.address).toMatch(/^\/userprofileaccess\/z/)
    expect(created.write).toEqual(['writer-id'])

    await expect((factory as any)({ orbitdb, identities, address: created.address })).resolves.toMatchObject({
      address: created.address,
      write: ['writer-id'],
    })
  })

  it('allows user profile PUT entries from team members when entry ids match', async () => {
    const access = await createAccess(createSigchainService())

    await expect(access.canAppend(createEntry())).resolves.toBe(true)
  })

  it('rejects user profile PUT entries from non-members', async () => {
    const access = await createAccess(createSigchainService({ member: false }))

    await expect(access.canAppend(createEntry())).resolves.toBe(false)
  })

  it('rejects user profile PUT entries without an active chain', async () => {
    const access = await createAccess({
      getActiveChain: jest.fn().mockReturnValue(undefined),
    })

    await expect(access.canAppend(createEntry())).resolves.toBe(false)
  })

  it('rejects user profile PUT entries from a different team identity', async () => {
    const access = await createAccess(createSigchainService(), { id: 'writer-id', teamId: 'other-team-id' })

    await expect(access.canAppend(createEntry())).resolves.toBe(false)
  })

  it('rejects user profile PUT entries when encrypted ids do not match the key', async () => {
    const access = await createAccess(createSigchainService())
    const entry = createEntry({
      value: createEncryptedPayload({
        userId: 'writer-id',
        sigAuthor: 'writer-id',
      }),
      key: 'other-user-id',
    })

    await expect(access.canAppend(entry)).resolves.toBe(false)
  })

  it('rejects user profile PUT entries when the writer does not match the encrypted signature author', async () => {
    const access = await createAccess(createSigchainService(), { id: 'other-user-id', teamId: 'team-id' })

    await expect(access.canAppend(createEntry())).resolves.toBe(false)
  })

  it('rejects user profile PUT entries when decrypted user id does not match the key', async () => {
    const access = await createAccess(
      createSigchainService({
        decryptedProfile: createUserProfile('other-user-id'),
      })
    )

    await expect(access.canAppend(createEntry())).resolves.toBe(false)
  })

  it('rejects user profile PUT entries when the encrypted payload signature is invalid', async () => {
    const access = await createAccess(createSigchainService({ signatureIsValid: false }))

    await expect(access.canAppend(createEntry())).resolves.toBe(false)
  })

  it('rejects user profile PUT entries when the decrypted profile is invalid', async () => {
    const access = await createAccess(
      createSigchainService({
        decryptedProfile: createUserProfile('writer-id', {
          photo: 'data:text/html,invalid',
        }),
      })
    )

    await expect(access.canAppend(createEntry())).resolves.toBe(false)
  })

  it('rejects user profile PUT entries when the payload value is missing', async () => {
    const access = await createAccess(createSigchainService())

    await expect(access.canAppend(createEntry({ includeValue: false }))).resolves.toBe(false)
  })

  it('allows members to delete their own user profile', async () => {
    const access = await createAccess(createSigchainService())

    await expect(access.canAppend(createEntry({ op: OrbitDbOp.DEL }))).resolves.toBe(true)
  })

  it('rejects members deleting another user profile', async () => {
    const access = await createAccess(createSigchainService())

    await expect(access.canAppend(createEntry({ op: OrbitDbOp.DEL, key: 'other-user-id' }))).resolves.toBe(false)
  })

  it('allows admins to delete another user profile', async () => {
    const access = await createAccess(createSigchainService({ admin: true }))

    await expect(access.canAppend(createEntry({ op: OrbitDbOp.DEL, key: 'other-user-id' }))).resolves.toBe(true)
  })
})
