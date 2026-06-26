import { describe, expect, it, jest } from '@jest/globals'
import { base58btc } from 'multiformats/bases/base58'
import { type LogEntry } from '@orbitdb/core'

import { ChannelMetadataAccessController } from './ChannelMetadataAccessController'
import { RoleName } from '../../../auth/services/roles/roles'
import { EncryptedAndSignedPayload } from '../../../auth/services/crypto/types'

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
}: {
  teamId?: string
  member?: boolean
  admin?: boolean
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
    }),
  }) as any

const createEntry = (
  op: 'PUT' | 'DEL',
  key = 'channel-id',
  hash = `${op.toLowerCase()}-${key}`
): LogEntry<EncryptedAndSignedPayload> =>
  ({
    hash,
    identity: 'writer-identity-hash',
    payload: {
      op,
      key,
      value: op === 'PUT' ? {} : undefined,
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

const createAccess = async (sigchainService: any) => {
  const controller = new ChannelMetadataAccessController(sigchainService)
  const factory = controller.createAccessControllerFunc({ write: ['*'], sigchainService })
  return (factory as any)({
    orbitdb: {
      identity: { id: 'local-orbitdb-identity' },
      ipfs: createInMemoryIpfs(),
    },
    identities: {
      getIdentity: jest.fn().mockResolvedValue({ id: 'writer-id', teamId: 'team-id' } as never),
      verifyIdentity: jest.fn().mockResolvedValue(true as never),
    },
  })
}

describe('ChannelMetadataAccessController', () => {
  it('loads the ACL manifest from a persisted typed access-controller address', async () => {
    const sigchainService = createSigchainService({})
    const controller = new ChannelMetadataAccessController(sigchainService)
    const factory = controller.createAccessControllerFunc({ write: ['writer-id'], sigchainService })
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

  it('allows channel metadata PUT entries from team members', async () => {
    const access = await createAccess(createSigchainService({ member: true }))
    attachLogContext(access)

    await expect(access.canAppend(createEntry('PUT'))).resolves.toBe(true)
  })

  it('rejects channel metadata PUT entries from non-members', async () => {
    const access = await createAccess(createSigchainService({ member: false }))
    attachLogContext(access)

    await expect(access.canAppend(createEntry('PUT'))).resolves.toBe(false)
  })

  it('rejects channel metadata PUT entries when log state is unavailable', async () => {
    const access = await createAccess(createSigchainService({ member: true }))

    await expect(access.canAppend(createEntry('PUT'))).resolves.toBe(false)
  })

  it('rejects channel metadata PUT entries when the entry key is missing', async () => {
    const access = await createAccess(createSigchainService({ member: true }))
    attachLogContext(access)
    const entry = createEntry('PUT')
    ;(entry.payload as any).key = undefined

    await expect(access.canAppend(entry)).resolves.toBe(false)
  })

  it('rejects channel metadata PUT entries when log traversal throws', async () => {
    const access = await createAccess(createSigchainService({ member: true }))
    access.setLogContext({
      traverse: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.reject(new Error('log read failed')),
        }),
      }),
    })

    await expect(access.canAppend(createEntry('PUT'))).resolves.toBe(false)
  })

  it('rejects channel metadata PUT entries when a previous PUT exists for the same key', async () => {
    const access = await createAccess(createSigchainService({ member: true }))
    const previousEntry = createEntry('PUT', 'channel-id', 'previous-channel-put')
    const nextEntry = createEntry('PUT', 'channel-id', 'next-channel-put')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('allows channel metadata PUT entries when previous PUTs are for different keys', async () => {
    const access = await createAccess(createSigchainService({ member: true }))
    const previousEntry = createEntry('PUT', 'other-channel-id')
    const nextEntry = createEntry('PUT', 'channel-id')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(true)
  })

  it('rejects channel metadata PUT entries after a prior PUT even when the latest entry is a DEL', async () => {
    const access = await createAccess(createSigchainService({ member: true }))
    const previousEntry = createEntry('PUT', 'channel-id', 'previous-channel-put')
    const deleteEntry = createEntry('DEL', 'channel-id', 'deleted-channel')
    const nextEntry = createEntry('PUT', 'channel-id', 'next-channel-put')
    attachLogContext(access, [deleteEntry, previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('rejects duplicate channel metadata PUT entries from admins', async () => {
    const access = await createAccess(createSigchainService({ member: false, admin: true }))
    const previousEntry = createEntry('PUT', 'channel-id', 'previous-channel-put')
    const nextEntry = createEntry('PUT', 'channel-id', 'next-channel-put')
    attachLogContext(access, [previousEntry])

    await expect(access.canAppend(nextEntry)).resolves.toBe(false)
  })

  it('rejects channel metadata DEL entries from non-admin members', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: false }))

    await expect(access.canAppend(createEntry('DEL'))).resolves.toBe(false)
  })

  it('allows channel metadata DEL entries from admins', async () => {
    const access = await createAccess(createSigchainService({ member: true, admin: true }))

    await expect(access.canAppend(createEntry('DEL'))).resolves.toBe(true)
  })

  it('allows channel metadata entries from admins even without the member role', async () => {
    const access = await createAccess(createSigchainService({ member: false, admin: true }))
    attachLogContext(access)

    await expect(access.canAppend(createEntry('PUT'))).resolves.toBe(true)
    await expect(access.canAppend(createEntry('DEL'))).resolves.toBe(true)
  })
})
