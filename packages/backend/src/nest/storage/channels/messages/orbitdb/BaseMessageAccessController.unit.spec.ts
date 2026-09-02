import { describe, expect, it } from '@jest/globals'
import { base58btc } from 'multiformats/bases/base58'

import { MessagesAccessController } from './MessagesAccessController'
import { PrivateMessagesAccessController } from './PrivateMessagesAccessController'

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

describe('BaseMessagesAccessController address handling', () => {
  it('loads the ACL manifest from a persisted typed access-controller address', async () => {
    const sigchainService = {} as any
    const controller = new MessagesAccessController(sigchainService)
    const write = ['writer-identity']
    const factory = controller.createAccessControllerFunc({
      write,
      sigchainService,
      channelId: 'channel-id',
      teamId: 'team-id',
    })
    const orbitdb = {
      identity: { id: 'local-orbitdb-identity' },
      ipfs: createInMemoryIpfs(),
    }
    const identities = {}

    const created = await (factory as any)({ orbitdb, identities })
    expect(created.address).toMatch(/^\/messagesaccess\/z/)
    expect(created.write).toEqual(write)

    await expect((factory as any)({ orbitdb, identities, address: created.address })).resolves.toMatchObject({
      address: created.address,
      write,
    })
  })

  it('keeps the legacy ACL address when team and channel security context is supplied', async () => {
    const sigchainService = {} as any
    const orbitdb = {
      identity: { id: 'local-orbitdb-identity' },
      ipfs: createInMemoryIpfs(),
    }
    const controller = new MessagesAccessController(sigchainService)
    const first = await (
      controller.createAccessControllerFunc({
        write: ['*'],
        sigchainService,
        channelId: 'first-channel',
        teamId: 'first-team',
      }) as any
    )({ orbitdb, identities: {} })
    const second = await (
      controller.createAccessControllerFunc({
        write: ['*'],
        sigchainService,
        channelId: 'second-channel',
        teamId: 'second-team',
      }) as any
    )({ orbitdb, identities: {} })

    expect(first.address).toEqual(second.address)
  })

  it.each([
    [
      'public',
      new MessagesAccessController({} as any).createAccessControllerFunc({
        write: ['alice'],
        sigchainService: {} as any,
        channelId: 'channel-id',
        teamId: 'team-id',
      }),
    ],
    [
      'private',
      new PrivateMessagesAccessController({} as any).createAccessControllerFunc({
        write: ['alice'],
        sigchainService: {} as any,
        channelId: 'channel-id',
        teamId: 'team-id',
        roleName: 'channel-role',
      }),
    ],
  ])('rejects a %s message when the entry key is not the claimed writer key', async (_label, factory) => {
    const access = await (factory as any)({
      orbitdb: { identity: { id: 'local' }, ipfs: createInMemoryIpfs() },
      identities: {
        getIdentity: async () => ({
          id: 'alice',
          publicKey: 'alice-public-key',
          deviceId: 'alice-device',
          teamId: 'team-id',
        }),
        verifyIdentity: async () => true,
        // A valid signature, so the rejection below can only come from the key mismatch.
        verify: async () => true,
      },
    })

    await expect(
      access.canAppend({
        id: 'message-log',
        identity: 'alice-identity',
        key: 'attacker-public-key',
        sig: 'attacker-signature',
        next: [],
        refs: [],
        clock: { id: 'attacker-public-key', time: 1 },
        v: 2,
        payload: { value: {} },
      })
    ).resolves.toBe(false)
  })

  it.each([
    [
      'public',
      new MessagesAccessController({} as any).createAccessControllerFunc({
        write: ['*'],
        sigchainService: {
          getChain: () => ({ roles: { memberHasRole: () => true } }),
        } as any,
        channelId: 'channel-id',
        teamId: 'team-id',
      }),
      'member',
    ],
    [
      'private',
      new PrivateMessagesAccessController({} as any).createAccessControllerFunc({
        write: ['*'],
        sigchainService: {
          getChain: () => ({ channels: { memberInChannel: () => true } }),
        } as any,
        channelId: 'channel-id',
        teamId: 'team-id',
        roleName: 'channel-role',
      }),
      'channel-role',
    ],
  ])('rejects a %s message when Mallory writes but the signature claims Alice', async (_label, factory, roleName) => {
    const access = await (factory as any)({
      orbitdb: { identity: { id: 'local' }, ipfs: createInMemoryIpfs() },
      identities: {
        getIdentity: async () => ({
          id: 'mallory',
          publicKey: 'mallory-public-key',
          deviceId: 'mallory-device',
          teamId: 'team-id',
        }),
        verifyIdentity: async () => true,
      },
    })
    const encryptedMessage = {
      id: 'message-id',
      teamId: 'team-id',
      channelId: 'channel-id',
      createdAt: 1234,
      contents: {
        contents: new Uint8Array([1, 2, 3]),
        scope: { type: 'ROLE', name: roleName, generation: 0 },
      },
      encSignature: {
        signature: 'invalid-but-shaped-signature',
        author: { type: 'USER', name: 'alice', generation: 0 },
      },
    }

    await expect(
      access.canAppend({
        identity: 'mallory-identity',
        key: 'mallory-public-key',
        payload: { value: encryptedMessage },
      })
    ).resolves.toBe(false)

    encryptedMessage.encSignature.author.name = 'mallory'
    await expect(
      access.canAppend({
        identity: 'mallory-identity',
        key: 'mallory-public-key',
        payload: { value: encryptedMessage },
      })
    ).resolves.toBe(true)
  })

  it.each([
    ['public', 'member'],
    ['private', 'channel-role'],
  ])('rejects a %s message when the writer identity belongs to a different team', async (kind, roleName) => {
    const sigchainService = {
      getChain: () => ({
        roles: { memberHasRole: () => true },
        channels: { memberInChannel: () => true },
      }),
    } as any
    const config = {
      write: ['*'],
      sigchainService,
      channelId: 'channel-id',
      teamId: 'team-id',
      roleName,
    }
    const identity = {
      id: 'alice',
      publicKey: 'alice-public-key',
      deviceId: 'alice-device',
      teamId: 'team-id',
    }
    const factory = (
      kind === 'public'
        ? new MessagesAccessController(sigchainService)
        : new PrivateMessagesAccessController(sigchainService)
    ).createAccessControllerFunc(config)
    const access = await (factory as any)({
      orbitdb: { identity: { id: 'local' }, ipfs: createInMemoryIpfs() },
      identities: {
        getIdentity: async () => identity,
        verifyIdentity: async () => true,
      },
    })
    const encryptedMessage = {
      id: 'message-id',
      teamId: 'team-id',
      channelId: 'channel-id',
      createdAt: 1234,
      contents: {
        contents: new Uint8Array([1, 2, 3]),
        scope: { type: 'ROLE', name: roleName, generation: 0 },
      },
      encSignature: {
        signature: 'invalid-but-shaped-signature',
        author: { type: 'USER', name: 'alice', generation: 0 },
      },
    }
    const entry = {
      identity: 'alice-identity',
      key: 'alice-public-key',
      payload: { value: encryptedMessage },
    }

    await expect(access.canAppend(entry)).resolves.toBe(true)
    identity.teamId = 'other-team'
    await expect(access.canAppend(entry)).resolves.toBe(false)
  })
})
