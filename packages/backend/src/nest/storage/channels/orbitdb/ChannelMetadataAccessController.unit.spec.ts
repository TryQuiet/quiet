import { describe, expect, it, jest } from '@jest/globals'
import { base58btc } from 'multiformats/bases/base58'
import { type LogEntry } from '@orbitdb/core'

import { ChannelMetadataAccessController } from './ChannelMetadataAccessController'
import { RoleName } from '../../../auth/services/roles/roles'
import { EncryptedAndSignedPayload } from '../../../auth/services/crypto/types'
import { OrbitDbOp } from '../../orbitDb/orbitdb.types'

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

const createSigchainService = ({
  teamId = 'team-id',
  member = true,
  admin = false,
  rolesMemberOf = [],
}: {
  teamId?: string
  member?: boolean
  admin?: boolean
  rolesMemberOf?: string[]
}) =>
  ({
    getActiveChain: jest.fn().mockReturnValue({
      team: { id: teamId },
      roles: {
        memberHasRole: jest.fn(
          (memberId: string, roleName: string) => memberId === 'writer-id' && roleName === RoleName.MEMBER && member
        ),
        memberIsAdmin: jest.fn((memberId: string) => memberId === 'writer-id' && admin),
      },
      channels: {
        canMemberCreatePrivateChannel: jest.fn((memberId: string) => memberId === 'writer-id' && admin),
        canMemberCreatePublicChannel: jest.fn((memberId: string) => memberId === 'writer-id' && admin),
        canMemberDeletePrivateChannel: jest.fn(
          (memberId: string, roleName: string) => memberId === 'writer-id' && admin && rolesMemberOf.includes(roleName)
        ),
        canMemberDeletePublicChannel: jest.fn((memberId: string) => memberId === 'writer-id' && admin),
      },
    }),
  }) as any

// A full OrbitDB entry shape. The writer chokepoint verifies the entry signature, and
// `Entry.verify` re-encodes these fields, so they all have to be present and dag-cbor encodable.
const createEntry = (
  op: OrbitDbOp,
  key = 'channel-id',
  hash = `${op.toLowerCase()}-${key}`
): LogEntry<EncryptedAndSignedPayload> =>
  ({
    id: 'channel-metadata-log',
    hash,
    identity: 'writer-identity-hash',
    key: 'writer-public-key',
    sig: 'writer-signature',
    next: [],
    refs: [],
    clock: { id: 'writer-public-key', time: 1 },
    v: 2,
    payload: {
      op,
      key,
      ...(op === OrbitDbOp.PUT ? { value: {} } : {}),
    },
  }) as unknown as LogEntry<EncryptedAndSignedPayload>

const attachLogContext = (access: any, entries: LogEntry<EncryptedAndSignedPayload>[] = []) => {
  access.setLogContext({
    traverse: async function* () {
      for (const entry of entries) {
        yield entry
      }
    },
  })
}

const createAccess = async (sigchainService: any, isPublic: boolean, idToRoleName: Record<string, string> = {}) => {
  const controller = new ChannelMetadataAccessController(sigchainService)
  const factory = controller.createAccessControllerFunc({
    write: ['*'],
    sigchainService,
    isPublic,
    getPrivateChannelsByRolename: async () => ({ idToRoleName, roleNameToChannel: {} }),
  })
  return (factory as any)({
    orbitdb: {
      identity: { id: 'local-orbitdb-identity' },
      ipfs: createInMemoryIpfs(),
    },
    identities: {
      getIdentity: jest
        .fn()
        .mockResolvedValue({ id: 'writer-id', teamId: 'team-id', publicKey: 'writer-public-key' } as never),
      verifyIdentity: jest.fn().mockResolvedValue(true as never),
      // Stands in for a valid entry signature; the substitution cases are covered end to end with
      // real LFA keys in signer-substitution.spec.ts.
      verify: jest.fn().mockResolvedValue(true as never),
    },
  })
}

describe('ChannelMetadataAccessController', () => {
  it('loads the ACL manifest from a persisted typed access-controller address', async () => {
    const sigchainService = createSigchainService({})
    const controller = new ChannelMetadataAccessController(sigchainService)
    const factory = controller.createAccessControllerFunc({
      write: ['writer-id'],
      sigchainService,
      isPublic: true,
      getPrivateChannelsByRolename: async () => ({ idToRoleName: {}, roleNameToChannel: {} }),
    })
    const orbitdb = {
      identity: { id: 'local-orbitdb-identity' },
      ipfs: createInMemoryIpfs(),
    }
    const identities = {}

    const created = await (factory as any)({ orbitdb, identities })
    expect(created.address).toMatch(/^\/channelmetadataaccess\/z/)
    expect(created.write).toEqual(['writer-id'])

    await expect((factory as any)({ orbitdb, identities, address: created.address })).resolves.toMatchObject({
      address: created.address,
      write: ['writer-id'],
    })
  })

  it('allows public channel metadata PUT entries from team members with correct permissions', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)
    attachLogContext(access)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(true)
  })

  it('rejects privileged channel metadata when the entry key belongs to another signer', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)
    attachLogContext(access)
    const entry = { ...createEntry(OrbitDbOp.PUT), key: 'attacker-public-key' }

    await expect(access.canAppend(entry)).resolves.toBe(false)
  })

  it('allows private channel metadata PUT entries from team members with correct permissions', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)
    attachLogContext(access)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(true)
  })

  it('rejects public channel metadata PUT entries from non-members', async () => {
    const access = await createAccess(createSigchainService({ member: false }), true)
    attachLogContext(access)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
  })

  it('rejects private channel metadata PUT entries from non-members', async () => {
    const access = await createAccess(createSigchainService({ member: false }), false)
    attachLogContext(access)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
  })

  it('rejects public channel metadata PUT entries when log state is unavailable', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
  })

  it('rejects private channel metadata PUT entries when log state is unavailable', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
  })

  it('rejects public channel metadata PUT entries when the entry key is missing', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)
    attachLogContext(access)
    const entry = createEntry(OrbitDbOp.PUT)
    // Removed rather than set to undefined so the entry stays dag-cbor encodable and the rejection
    // comes from the missing key, not from a signature check that could not run.
    delete (entry.payload as any).key

    await expect(access.canAppend(entry)).resolves.toBe(false)
  })

  it('rejects private channel metadata PUT entries when the entry key is missing', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)
    attachLogContext(access)
    const entry = createEntry(OrbitDbOp.PUT)
    // Removed rather than set to undefined so the entry stays dag-cbor encodable and the rejection
    // comes from the missing key, not from a signature check that could not run.
    delete (entry.payload as any).key

    await expect(access.canAppend(entry)).resolves.toBe(false)
  })

  it('rejects public channel metadata PUT entries when log traversal throws', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)
    access.setLogContext({
      traverse: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.reject(new Error('log read failed')),
        }),
      }),
    })

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
  })

  it('rejects private channel metadata PUT entries when log traversal throws', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)
    access.setLogContext({
      traverse: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.reject(new Error('log read failed')),
        }),
      }),
    })

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
  })

  it('rejects public channel metadata PUT entries when a previous PUT exists for the same key', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'previous-channel-put')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'next-channel-put')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('rejects private channel metadata PUT entries when a previous PUT exists for the same key', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'previous-channel-put')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'next-channel-put')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('allows public channel metadata PUT entries when previous PUTs are for different keys', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'other-channel-id')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(true)
  })

  it('allows private channel metadata PUT entries when previous PUTs are for different keys', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'other-channel-id')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(true)
  })

  it('rejects public channel metadata PUT entries after a prior PUT even when the latest entry is a DEL', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'previous-channel-put')
    const deleteEntry = createEntry(OrbitDbOp.DEL, 'channel-id', 'deleted-channel')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'next-channel-put')
    attachLogContext(access, [deleteEntry, previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('rejects private channel metadata PUT entries after a prior PUT even when the latest entry is a DEL', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'previous-channel-put')
    const deleteEntry = createEntry(OrbitDbOp.DEL, 'channel-id', 'deleted-channel')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'next-channel-put')
    attachLogContext(access, [deleteEntry, previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('rejects duplicate public channel metadata PUT entries from admins', async () => {
    const access = await createAccess(createSigchainService({ member: false, admin: true }), true)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'previous-channel-put')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'next-channel-put')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('rejects duplicate private channel metadata PUT entries from admins', async () => {
    const access = await createAccess(createSigchainService({ member: false, admin: true }), true)
    const previousEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'previous-channel-put')
    const nextEntry = createEntry(OrbitDbOp.PUT, 'channel-id', 'next-channel-put')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('rejects public channel metadata DEL entries from non-admin members', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: false }), true)

    await expect(access.canAppend(createEntry(OrbitDbOp.DEL))).resolves.toBe(false)
  })

  it('rejects private channel metadata DEL entries from non-admin members', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: false }), false)

    await expect(access.canAppend(createEntry(OrbitDbOp.DEL))).resolves.toBe(false)
  })

  it('allows public channel metadata DEL entries from admins', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), true)

    await expect(access.canAppend(createEntry(OrbitDbOp.DEL))).resolves.toBe(true)
  })

  it('allows private channel metadata DEL entries from admins with valid channel role name', async () => {
    const channelId = 'foobar'
    const roleName = 'barbaz'
    const access = await createAccess(
      createSigchainService({ member: true, admin: true, rolesMemberOf: [roleName] }),
      false,
      { [channelId]: roleName }
    )

    await expect(access.canAppend(createEntry(OrbitDbOp.DEL, channelId))).resolves.toBe(true)
  })

  it('rejects private channel metadata DEL entries from admins without valid channel role name', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }), false)

    await expect(access.canAppend(createEntry(OrbitDbOp.DEL))).resolves.toBe(false)
  })

  it('rejects public channel metadata entries from admins even without the member role', async () => {
    const access = await createAccess(createSigchainService({ member: false, admin: true }), true)
    attachLogContext(access)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
    await expect(access.canAppend(createEntry(OrbitDbOp.DEL))).resolves.toBe(false)
  })

  it('rejects private channel metadata entries from admins even without the member role', async () => {
    const access = await createAccess(createSigchainService({ member: false, admin: true }), false)
    attachLogContext(access)

    await expect(access.canAppend(createEntry(OrbitDbOp.PUT))).resolves.toBe(false)
    await expect(access.canAppend(createEntry(OrbitDbOp.DEL))).resolves.toBe(false)
  })
})
