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
    const factory = controller.createAccessControllerFunc({ write, sigchainService })
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

  it.each([
    [
      'public',
      new MessagesAccessController({} as any).createAccessControllerFunc({
        write: ['alice'],
        sigchainService: {} as any,
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
        getIdentity: async () => ({ id: 'alice', publicKey: 'alice-public-key' }),
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
})
