import { describe, expect, it } from '@jest/globals'
import { base58btc } from 'multiformats/bases/base58'

import { MessagesAccessController } from './MessagesAccessController'

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
})
