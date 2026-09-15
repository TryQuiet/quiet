import { createFirstUseDevice, createUser, createTeam, deriveUserId } from '@localfirst/auth'
import { CryptoService } from '../../auth/services/crypto/crypto.service'
import { PublicChannelMessagesService } from './messages/public-channel-messages.service'
import EventEmitter from 'node:events'
import { jest } from '@jest/globals'

import { ChannelStore } from './channel.store'
import { SigchainEvents } from '../../auth/types'
import { StorageEvents } from '../storage.types'

describe('ChannelStore', () => {
  const makeLogger = () => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn(),
  })

  async function* emptyIterator() {}

  it('ignores update entries without a matching channel id', async () => {
    const channelId = 'channel-1'
    const storeEvents = new EventEmitter()
    const messagesService = {
      onConsume: jest.fn(),
    }
    const localDbService = {
      getCurrentCommunity: jest.fn(async () => ({ id: 'community-1' })),
    }
    const auth = Object.assign(new EventEmitter(), {
      team: { id: 'team-1' },
    })
    const channelStore = new ChannelStore(
      {} as any,
      localDbService as any,
      messagesService as any,
      {} as any,
      {} as any,
      auth as any,
      {} as any,
      {} as any
    )
    ;(channelStore as any).channelData = {
      id: channelId,
      name: 'general',
      public: true,
      teamId: 'team-1',
    }
    ;(channelStore as any).logger = makeLogger()
    ;(channelStore as any)._messagesService = messagesService
    ;(channelStore as any).store = {
      events: storeEvents,
      iterator: emptyIterator,
      sync: {
        start: jest.fn(async () => {}),
      },
    }

    const messageIdsListener = jest.fn()
    channelStore.on(StorageEvents.MESSAGE_IDS_STORED, messageIdsListener)
    await channelStore.subscribe()
    messageIdsListener.mockClear()
    localDbService.getCurrentCommunity.mockClear()

    storeEvents.emit('update', {
      hash: 'non-message-entry',
      payload: {
        value: {
          id: 'non-message-value',
        },
      },
    })
    await new Promise(resolve => setImmediate(resolve))

    expect(messagesService.onConsume).not.toHaveBeenCalled()
    expect(localDbService.getCurrentCommunity).not.toHaveBeenCalled()
    expect(messageIdsListener).not.toHaveBeenCalled()
  })
})

describe('ChannelStore incremental message IDs', () => {
  const createStore = () => {
    const entries: { hash: string; value: any }[] = []
    const events = new EventEmitter()
    const entriesByHash = new Map<string, any>()
    const reads = { iterator: 0, get: 0 }
    const auth = Object.assign(new EventEmitter(), { team: { id: 'team' } })
    const onConsume = jest.fn<(message: any) => Promise<any>>(async message => ({ ...message, verified: true }))
    const store = new ChannelStore(
      {} as any,
      {
        getCurrentCommunity: async () => ({ id: 'community' }),
      } as any,
      { onConsume } as any,
      {} as any,
      {} as any,
      auth as any,
      {} as any,
      {} as any
    )
    Object.assign(store, {
      channelData: { id: 'general', name: 'general', public: true, teamId: 'team' },
      logger: Object.fromEntries(['info', 'debug', 'trace', 'warn', 'error'].map(key => [key, () => {}])),
      _messagesService: { onConsume },
      store: {
        events,
        iterator: async function* () {
          for (const entry of entries) {
            reads.iterator++
            yield entry
          }
        },
        get: async (hash: string) => {
          reads.get++
          return entriesByHash.get(hash)
        },
        sync: { start: async () => {}, stop: async () => {} },
        close: async () => {},
      },
    })
    const ids = jest.fn<(event: any) => void>()
    store.on(StorageEvents.MESSAGE_IDS_STORED, ids)
    const append = async (id: string, hash = id, value: any = { id, channelId: 'general', teamId: 'team' }) => {
      entries.push({ hash, value })
      entriesByHash.set(hash, value)
      await (events.listeners('update')[0] as (...args: any[]) => Promise<void>)({ hash, payload: { value } })
    }
    return { store, auth, entries, onConsume, ids, append, reads }
  }

  it('consumes 1,000 serial arrivals exactly once each, instead of 501,500 times', async () => {
    const { store, onConsume, ids, append } = createStore()
    await store.subscribe()
    for (let n = 0; n < 1_000; n++) await append(`message-${n}`)
    expect(onConsume).toHaveBeenCalledTimes(1_000)
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).toHaveLength(1_000)
    expect(ids.mock.calls.slice(1).every(([event]) => event.ids.length === 1)).toBe(true)
  })

  it('fetches each announced message directly without rescanning growing history', async () => {
    const { store, onConsume, append, reads } = createStore()
    await store.subscribe()
    for (let n = 0; n < 1000; n++) {
      const id = `message-${n}`
      await append(id)
      expect((await store.getEntries([id])).map(message => message.id)).toEqual([id])
    }
    expect(reads).toEqual({ iterator: 0, get: 1000 })
    expect(onConsume).toHaveBeenCalledTimes(2000) // Arrival plus explicit frontend fetch.
    expect(await store.getEntries(['unknown'])).toEqual([])
    expect(await store.getEntries([])).toEqual([])
    expect(reads.iterator).toBe(0)
  })

  it('preserves iterator order and duplicate-ID entries for ambiguous/batch reads', async () => {
    const { store, append, reads } = createStore()
    await store.subscribe()
    await append('same', 'first')
    await append('middle')
    await append('same', 'second')
    expect((await store.getEntries(['same'])).map(message => message.id)).toEqual(['same', 'same'])
    expect((await store.getEntries(['same', 'middle'])).map(message => message.id)).toEqual(['same', 'middle', 'same'])
    expect(reads.get).toBe(0)
    expect(reads.iterator).toBe(6)
  })

  it('processes authentic encrypted and signed arrivals and excludes tampered entries', async () => {
    const device = createFirstUseDevice({ deviceName: 'test phone' })
    const user = createUser('sender', deriveUserId(device.deviceId))
    const context = { user, device: { ...device, userId: user.userId } }
    const team = createTeam('incremental message test', context)
    team.addRole('member')
    team.addMemberRole(user.userId, 'member')
    const chain: any = {
      team,
      context,
      user,
      roles: { amIMemberOfRole: (role: string) => team.memberHasRole(user.userId, role) },
    }
    chain.crypto = new CryptoService(chain)
    const service = new PublicChannelMessagesService({
      getChain: (id: string) => (id === team.id ? chain : undefined),
      getActiveChain: () => chain,
    } as any)
    const channel = {
      id: 'general',
      name: 'general',
      public: true,
      teamId: team.id,
      description: 'Signed message fixture',
      owner: user.userId,
      timestamp: 1700000000000,
    }
    const { store, onConsume, ids, append } = createStore()
    onConsume.mockImplementation(message => service.onConsume(message, channel))
    await store.subscribe()
    let encrypted: any
    for (let n = 0; n < 1_000; n++) {
      encrypted = await service.onSend(
        {
          id: `signed-${n}`,
          channelId: 'general',
          userId: user.userId,
          message: `message ${n}`,
          type: 1,
          createdAt: 1700000000000 + n,
        } as any,
        channel
      )
      await append(encrypted.id, encrypted.id, encrypted)
    }
    await append('wrong-id', 'tampered-id', { ...encrypted, id: 'wrong-id' })
    const cipher = Uint8Array.from(encrypted.contents.contents)
    cipher[cipher.length - 1] ^= 1
    await append('wrong-cipher', 'tampered-cipher', {
      ...encrypted,
      contents: { ...encrypted.contents, contents: cipher },
    })
    expect(onConsume).toHaveBeenCalledTimes(1_002)
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).toEqual(
      Array.from({ length: 1_000 }, (_, n) => `signed-${n}`)
    )
  })

  it('coalesces a concurrent backlog without losing arrivals or trusting rejected IDs', async () => {
    const { store, onConsume, ids, append } = createStore()
    onConsume.mockImplementation(async message =>
      message.id === 'invalid' ? undefined : { ...message, verified: true }
    )
    await store.subscribe()
    await Promise.all(Array.from({ length: 100 }, (_, n) => append(`message-${n}`)))
    await append('invalid')
    expect(onConsume).toHaveBeenCalledTimes(101)
    expect(new Set(ids.mock.calls.flatMap(([event]) => event.ids))).toEqual(
      new Set(Array.from({ length: 100 }, (_, n) => `message-${n}`))
    )
  })

  it('retries unreadable history and removes old IDs when authorization changes', async () => {
    const { store, auth, entries, onConsume, ids } = createStore()
    entries.push({ hash: 'cipher', value: { id: 'message', channelId: 'general' } })
    let allowed = false
    onConsume.mockImplementation(async message => (allowed ? { ...message, verified: true } : undefined))
    await store.subscribe()
    expect(ids.mock.lastCall?.[0].ids).toEqual([])
    allowed = true
    auth.emit(SigchainEvents.UPDATED)
    await new Promise(resolve => setImmediate(resolve))
    expect(ids.mock.lastCall?.[0].ids).toEqual(['message'])
    allowed = false
    auth.emit(SigchainEvents.UPDATED)
    await new Promise(resolve => setImmediate(resolve))
    expect(ids.mock.lastCall?.[0].ids).toEqual([])
  })

  it('discards an old rebuild across close/reopen and retries the replacement store', async () => {
    const { store, entries, onConsume, ids } = createStore()
    entries.push({ hash: 'old', value: { id: 'old', channelId: 'general' } })
    let resume!: () => void
    const paused = new Promise<void>(resolve => {
      resume = resolve
    })
    onConsume.mockImplementationOnce(async message => {
      await paused
      return { ...message, verified: true }
    })
    const subscribing = store.subscribe()
    await new Promise(resolve => setImmediate(resolve))
    await store.close()
    const replacement = createStore()
    replacement.entries.push({ hash: 'replacement', value: { id: 'replacement', channelId: 'general' } })
    // Recreate the state transition performed by init, retaining the original in-flight builder.
    Object.assign(store, { store: (replacement.store as any).store, closing: false })
    resume()
    await subscribing
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).not.toContain('old')
    expect(ids.mock.lastCall?.[0].ids).toEqual(['replacement'])
  })

  it('retries the replacement store when an old pending rebuild rejects after reopen', async () => {
    const { store, entries, onConsume, ids } = createStore()
    entries.push({ hash: 'old', value: { id: 'old', channelId: 'general' } })
    let reject!: (error: Error) => void
    const paused = new Promise<void>((_resolve, rejectPromise) => {
      reject = rejectPromise
    })
    onConsume.mockImplementationOnce(async message => {
      await paused
      return message
    })
    const subscribing = store.subscribe()
    await new Promise(resolve => setImmediate(resolve))
    await store.close()
    const replacement = createStore()
    replacement.entries.push({ hash: 'replacement', value: { id: 'replacement', channelId: 'general' } })
    Object.assign(store, { store: (replacement.store as any).store, closing: false })
    reject(new Error('Old store is closed'))
    await subscribing
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).not.toContain('old')
    expect(ids.mock.lastCall?.[0].ids).toEqual(['replacement'])
  })

  it('does not publish a consume completed after authorization was invalidated', async () => {
    const { store, auth, onConsume, ids, append } = createStore()
    await store.subscribe()
    let resume!: () => void
    const paused = new Promise<void>(resolve => {
      resume = resolve
    })
    onConsume.mockImplementationOnce(async message => {
      await paused
      return { ...message, verified: true }
    })
    onConsume.mockImplementation(async () => undefined)
    const arrival = append('revoked')
    await new Promise(resolve => setImmediate(resolve))
    auth.emit(SigchainEvents.UPDATED)
    resume()
    await arrival
    await new Promise(resolve => setImmediate(resolve))
    expect(ids.mock.calls.every(([event]) => !event.ids.includes('revoked'))).toBe(true)
  })
})
