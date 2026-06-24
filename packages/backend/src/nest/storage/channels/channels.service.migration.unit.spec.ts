import { describe, expect, it, jest } from '@jest/globals'

import { ChannelsService } from './channels.service'

const createChannelsService = (orbitDbService: any, isAdmin = false) =>
  new ChannelsService(
    '/tmp/orbitdb',
    '/tmp/ipfs',
    {} as any,
    orbitDbService,
    {} as any,
    {
      getActiveChain: jest.fn().mockReturnValue({
        user: { userId: 'local-user-id' },
        roles: {
          memberIsAdmin: jest.fn((userId: string) => userId === 'local-user-id' && isAdmin),
        },
      }),
    } as any,
    {
      createAccessControllerFunc: jest.fn(() => 'channel-metadata-access-controller'),
    } as any
  )

describe('ChannelsService channel metadata access-controller migration', () => {
  it('keeps a non-empty legacy channel metadata store for non-admin users until the new store is populated', async () => {
    const legacyStore = {
      address: '/orbitdb/legacy-channel-metadata',
      all: jest.fn().mockResolvedValue([{ key: 'general', value: {} }] as never),
      close: jest.fn(),
    }
    const newStore = {
      address: '/orbitdb/new-channel-metadata',
      all: jest.fn().mockResolvedValue([] as never),
      close: jest.fn().mockResolvedValue(undefined as never),
    }
    const orbitDbService = {
      open: jest
        .fn()
        .mockResolvedValueOnce(legacyStore as never)
        .mockResolvedValueOnce(newStore as never),
    }
    const channelsService = createChannelsService(orbitDbService)

    const result = await (channelsService as any).openMigratedChannelsDb()

    expect(result).toBe(legacyStore)
    expect(orbitDbService.open).toHaveBeenCalledTimes(2)
    expect(legacyStore.close).not.toHaveBeenCalled()
    expect(newStore.close).toHaveBeenCalled()
  })

  it('closes an empty legacy channel metadata store and opens the new store', async () => {
    const legacyStore = {
      address: '/orbitdb/legacy-channel-metadata',
      all: jest.fn().mockResolvedValue([] as never),
      close: jest.fn().mockResolvedValue(undefined as never),
    }
    const newStore = {
      address: '/orbitdb/new-channel-metadata',
      all: jest.fn().mockResolvedValue([] as never),
    }
    const orbitDbService = {
      open: jest
        .fn()
        .mockResolvedValueOnce(legacyStore as never)
        .mockResolvedValueOnce(newStore as never),
    }
    const channelsService = createChannelsService(orbitDbService)

    const result = await (channelsService as any).openMigratedChannelsDb()

    expect(result).toBe(newStore)
    expect(orbitDbService.open).toHaveBeenCalledTimes(2)
    expect(legacyStore.close).toHaveBeenCalled()
  })

  it('uses a populated new channel metadata store when one exists', async () => {
    const legacyStore = {
      address: '/orbitdb/legacy-channel-metadata',
      all: jest.fn().mockResolvedValue([{ key: 'general', value: {} }] as never),
      close: jest.fn().mockResolvedValue(undefined as never),
    }
    const newStore = {
      address: '/orbitdb/new-channel-metadata',
      all: jest.fn().mockResolvedValue([{ key: 'general', value: {} }] as never),
      close: jest.fn(),
    }
    const orbitDbService = {
      open: jest
        .fn()
        .mockResolvedValueOnce(legacyStore as never)
        .mockResolvedValueOnce(newStore as never),
    }
    const channelsService = createChannelsService(orbitDbService)

    const result = await (channelsService as any).openMigratedChannelsDb()

    expect(result).toBe(newStore)
    expect(legacyStore.close).toHaveBeenCalled()
    expect(newStore.close).not.toHaveBeenCalled()
  })

  it('lets admin users populate the new channel metadata store from legacy entries', async () => {
    const legacyEntry = { key: 'general', value: {} }
    const legacyStore = {
      address: '/orbitdb/legacy-channel-metadata',
      all: jest.fn().mockResolvedValue([legacyEntry] as never),
      close: jest.fn().mockResolvedValue(undefined as never),
    }
    const newStore = {
      address: '/orbitdb/new-channel-metadata',
      all: jest.fn().mockResolvedValue([] as never),
      put: jest.fn().mockResolvedValue(undefined as never),
      close: jest.fn(),
    }
    const orbitDbService = {
      open: jest
        .fn()
        .mockResolvedValueOnce(legacyStore as never)
        .mockResolvedValueOnce(newStore as never),
    }
    const channelsService = createChannelsService(orbitDbService, true)

    const result = await (channelsService as any).openMigratedChannelsDb()

    expect(result).toBe(newStore)
    expect(newStore.put).toHaveBeenCalledWith(legacyEntry.key, legacyEntry.value)
    expect(legacyStore.close).toHaveBeenCalled()
    expect(newStore.close).not.toHaveBeenCalled()
  })
})
