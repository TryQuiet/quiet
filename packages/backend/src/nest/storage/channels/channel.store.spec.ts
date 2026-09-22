import { createFirstUseDevice, createUser, createTeam, deriveUserId } from '@localfirst/auth'
import { CryptoService } from '../../auth/services/crypto/crypto.service'
import { PublicChannelMessagesService } from './messages/public-channel-messages.service'
import EventEmitter from 'node:events'
import { jest } from '@jest/globals'
import { ChannelStore } from './channel.store'
import { SigchainEvents } from '../../auth/types'
import { StorageEvents } from '../storage.types'
import { ChannelType, ConsumedChannelMessage, MessageType, PushNotificationPayload } from '@quiet/types'

describe('ChannelStore', () => {
  const makeLogger = () => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn(),
  })

  async function* emptyIterator() {}

  describe('mobile notifications from channel updates', () => {
    const originalBackend = process.env.BACKEND
    const originalConnectionTime = process.env.CONNECTION_TIME
    let channelStore: ChannelStore
    let storeEvents: EventEmitter
    let messages: ConsumedChannelMessage[]
    let localUserId: string | undefined
    let getUsername: ReturnType<typeof jest.fn<(id: string) => Promise<string | undefined>>>
    let stored: ReturnType<typeof jest.fn>
    let storedIds: ReturnType<typeof jest.fn>
    let notifications: PushNotificationPayload[]

    beforeEach(async () => {
      process.env.BACKEND = 'mobile'
      process.env.CONNECTION_TIME = '100'
      localUserId = 'self-id'
      messages = []
      notifications = []
      storeEvents = new EventEmitter()
      // The event-store boundary models local writes and replicated updates alike.
      // Full encryption and OrbitDB writes are also exercised in channels.service.spec.ts.
      const messagesService = {
        onConsume: jest.fn(async (message: ConsumedChannelMessage) => message),
      }
      getUsername = jest.fn(async (_id: string) => 'Alice')
      const auth = Object.assign(new EventEmitter(), {
        getActiveChain: jest.fn(() => (localUserId == null ? undefined : { user: { userId: localUserId } })),
      })
      channelStore = new ChannelStore(
        {} as any,
        { getCurrentCommunity: async () => ({ id: 'community-1' }) } as any,
        messagesService as any,
        {} as any,
        // Direct messages service, added between private messages and the user profile store by
        // the DM work; 10.0.0's spec predates it.
        {} as any,
        { getUsername } as any,
        auth as any,
        {} as any,
        {} as any
      )
      ;(channelStore as any).channelData = { id: 'channel-1', name: 'general', public: true }
      ;(channelStore as any).logger = makeLogger()
      ;(channelStore as any)._messagesService = messagesService
      // The index reads accepted entries from the log; each fake entry's hash is its message ID.
      const logEntry = (index: number) => ({
        hash: messages[index].id,
        payload: { value: messages[index] },
        next: index > 0 ? [messages[index - 1].id] : [],
        refs: [],
      })
      const indexOf = (hash: string) => messages.findIndex(message => message.id === hash)
      ;(channelStore as any).store = {
        events: storeEvents,
        iterator: async function* () {
          for (const message of messages) yield { hash: message.id, value: message }
        },
        log: {
          heads: async () => (messages.length === 0 ? [] : [logEntry(messages.length - 1)]),
          has: async (hash: string) => indexOf(hash) >= 0,
          get: async (hash: string) => (indexOf(hash) >= 0 ? logEntry(indexOf(hash)) : undefined),
        },
        sync: { start: async () => {} },
      }
      stored = jest.fn()
      storedIds = jest.fn()
      channelStore.on(StorageEvents.MESSAGES_STORED, stored)
      channelStore.on(StorageEvents.MESSAGE_IDS_STORED, storedIds)
      channelStore.on(StorageEvents.SEND_PUSH_NOTIFICATION, payload => notifications.push(payload))
      await channelStore.subscribe()
      storedIds.mockClear()
    })

    afterEach(() => {
      if (originalBackend == null) delete process.env.BACKEND
      else process.env.BACKEND = originalBackend
      if (originalConnectionTime == null) delete process.env.CONNECTION_TIME
      else process.env.CONNECTION_TIME = originalConnectionTime
    })

    const update = async (overrides: Partial<ConsumedChannelMessage> = {}) => {
      const message: ConsumedChannelMessage = {
        id: `message-${messages.length}`,
        userId: 'self-id',
        channelId: 'channel-1',
        teamId: 'team-1',
        type: MessageType.Basic,
        message: 'hello',
        createdAt: 101,
        verified: true,
        ...overrides,
      }
      messages.push(message)
      // Await the production subscription listener, including its notification and ID refresh.
      const listener = storeEvents.listeners('update')[0] as (entry: unknown) => Promise<void>
      await listener({ hash: message.id, payload: { value: message } })
      expect(stored).toHaveBeenLastCalledWith({ messages: [message], isVerified: message.verified })
      // Once the index is built, an ordinary arrival announces only the IDs it added.
      expect(storedIds).toHaveBeenLastCalledWith({
        ids: [message.id],
        channelId: message.channelId,
        communityId: 'community-1',
      })
      return message
    }

    it.each([MessageType.Basic, MessageType.Info])(
      'stores fresh own messages of type %s without notifying',
      async type => {
        getUsername.mockResolvedValue(undefined)
        await update({ type, message: type === MessageType.Info ? 'Created #general' : 'hello' })
        expect(notifications).toEqual([])
        expect(getUsername).not.toHaveBeenCalled()
      }
    )

    it('uses user identity even when another author has the same nickname', async () => {
      await update()
      const other = await update({ userId: 'other-id' })
      // An own write finishing after the other message must also remain silent.
      await update({ type: MessageType.Info, message: 'Created #general' })
      expect(notifications).toEqual([{ message: JSON.stringify(other), username: 'Alice' }])
      expect(getUsername).toHaveBeenCalledTimes(1)
      expect(getUsername).toHaveBeenCalledWith('other-id')
    })

    it.each([undefined, ''])('keeps syncing but does not notify without a local user ID (%s)', async userId => {
      localUserId = userId
      await update()
      await update({ userId: 'other-id' })
      expect(notifications).toEqual([])
      expect(getUsername).not.toHaveBeenCalled()
    })

    it('reads the current identity when a pending write finishes', async () => {
      // The identity may change after subscription, before a pending local write lands.
      localUserId = 'new-local-id'
      await update({ userId: 'new-local-id', createdAt: 150 })
      expect(notifications).toEqual([])
    })

    it.each([{ verified: false }, { createdAt: 99 }])(
      'keeps existing freshness and verification gates (%s)',
      async overrides => {
        await update({ userId: 'other-id', ...overrides })
        expect(notifications).toEqual([])
      }
    )

    it('leaves desktop notification ownership with the desktop frontend', async () => {
      process.env.BACKEND = 'desktop'
      await update({ userId: 'other-id' })
      expect(notifications).toEqual([])
    })
  })

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
      log: { heads: async () => [] },
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
  const createStore = (events = new EventEmitter()) => {
    type Entry = { hash: string; value: any; next?: string[]; refs?: string[] }
    const entries: Entry[] = []
    const entriesByHash = new Map<string, any>()
    const logEntries = new Map<string, any>()
    const logReads = { has: 0, get: 0 }
    const save = (entry: Entry) => {
      entries.push(entry)
      entriesByHash.set(entry.hash, entry.value)
      logEntries.set(entry.hash, {
        hash: entry.hash,
        payload: { value: entry.value },
        next: entry.next ?? [],
        refs: entry.refs ?? [],
      })
    }
    const reads = { iterator: 0, get: 0 }
    // develop resolves the local identity from the active chain when deciding whether to notify.
    const auth = Object.assign(new EventEmitter(), {
      team: { id: 'team' },
      getActiveChain: () => ({ user: { userId: 'self' } }),
    })
    const onConsume = jest.fn<(message: any) => Promise<any>>(async message => ({ ...message, verified: true }))
    const getUsername = jest.fn<(userId: string) => Promise<string | undefined>>(async () => undefined)
    const store = new ChannelStore(
      {} as any,
      {
        getCurrentCommunity: async () => ({ id: 'community' }),
      } as any,
      { onConsume } as any,
      {} as any,
      {} as any, // DirectMessagesService (develop)
      { getUsername } as any,
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
        log: {
          heads: async () => {
            // Existing-history tests seed entries before subscribe; index those fixtures here.
            for (const entry of entries) {
              if (!logEntries.has(entry.hash)) {
                logEntries.set(entry.hash, {
                  hash: entry.hash,
                  payload: { value: entry.value },
                  next: entry.next ?? [],
                  refs: entry.refs ?? [],
                })
                entriesByHash.set(entry.hash, entry.value)
              }
            }
            const parents = new Set(entries.flatMap(entry => entry.next ?? []))
            return [...logEntries.values()].filter(entry => !parents.has(entry.hash))
          },
          has: async (hash: string) => {
            logReads.has++
            return logEntries.has(hash)
          },
          get: async (hash: string) => {
            logReads.get++
            return logEntries.get(hash)
          },
        },
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
    const announce = async (hash: string) => {
      await (events.listeners('update')[0] as (...args: any[]) => Promise<void>)(logEntries.get(hash))
    }
    const append = async (id: string, hash = id, value: any = { id, channelId: 'general', teamId: 'team' }) => {
      const previous = entries.at(-1)?.hash
      save({ hash, value, next: previous === undefined ? [] : [previous] })
      await announce(hash)
    }
    return { store, auth, entries, onConsume, getUsername, ids, append, reads, logReads, save, announce, logEntries }
  }

  it.each(['unchanged', 'auth invalidated', 'closed'] as const)(
    'emits a deferred mobile notification only while its originating context is current: %s',
    async change => {
      const previousBackend = process.env.BACKEND
      const previousConnectionTime = process.env.CONNECTION_TIME
      process.env.BACKEND = 'mobile'
      process.env.CONNECTION_TIME = '0'
      try {
        const { store, auth, append, onConsume, getUsername } = createStore()
        const notifications: PushNotificationPayload[] = []
        store.on(StorageEvents.SEND_PUSH_NOTIFICATION, payload => notifications.push(payload))
        let resume!: (username: string) => void
        const lookup = new Promise<string>(resolve => {
          resume = resolve
        })
        getUsername.mockImplementationOnce(async () => lookup)
        await store.subscribe()
        const arrival = append('push-message', 'push-message', {
          id: 'push-message',
          channelId: 'general',
          teamId: 'team',
          userId: 'sender',
          message: 'Notification body',
          createdAt: Date.now(),
        })
        await new Promise(resolve => setImmediate(resolve))
        expect(getUsername).toHaveBeenCalledWith('sender')
        expect(notifications).toEqual([])
        if (change === 'auth invalidated') {
          onConsume.mockImplementation(async () => false)
          auth.emit(SigchainEvents.UPDATED)
          await new Promise(resolve => setImmediate(resolve))
        } else if (change === 'closed') {
          await store.close()
        }
        resume('Alice')
        await arrival
        if (change === 'unchanged') {
          expect(notifications).toHaveLength(1)
          expect(notifications[0].username).toBe('Alice')
          expect(JSON.parse(notifications[0].message)).toMatchObject({
            id: 'push-message',
            userId: 'sender',
            message: 'Notification body',
            verified: true,
          })
        } else {
          expect(notifications).toEqual([])
        }
      } finally {
        if (previousBackend === undefined) delete process.env.BACKEND
        else process.env.BACKEND = previousBackend
        if (previousConnectionTime === undefined) delete process.env.CONNECTION_TIME
        else process.env.CONNECTION_TIME = previousConnectionTime
      }
    }
  )

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
    const { store, onConsume, ids, append, save, announce } = createStore()
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
    save({ hash: 'tampered-id', value: { ...encrypted, id: 'wrong-id' }, next: [encrypted.id] })
    const cipher = Uint8Array.from(encrypted.contents.contents)
    cipher[cipher.length - 1] ^= 1
    save({
      hash: 'tampered-cipher',
      value: {
        ...encrypted,
        contents: { ...encrypted.contents, contents: cipher },
      },
      next: ['tampered-id'],
    })
    save({ hash: 'backlog-head', value: encrypted, next: ['tampered-cipher'] })
    await announce('backlog-head')
    expect(onConsume).toHaveBeenCalledTimes(1_003)
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).toEqual([
      ...Array.from({ length: 1_000 }, (_, n) => `signed-${n}`),
      'signed-999',
    ])
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

  const value = (id: string) => ({ id, channelId: 'general', teamId: 'team' })
  const waitFor = async (condition: () => boolean, timeoutMs = 5_000) => {
    const started = Date.now()
    while (!condition()) {
      if (Date.now() - started > timeoutMs) throw new Error('Timed out waiting for the background retry')
      await new Promise(resolve => setTimeout(resolve, 5))
    }
  }

  it('ignores a shared-bus head until this peer actually joins it', async () => {
    const events = new EventEmitter()
    const sender = createStore(events)
    const receiver = createStore(events)
    await sender.store.subscribe()
    await receiver.store.subscribe()
    sender.ids.mockClear()
    receiver.ids.mockClear()
    sender.save({ hash: 'remote-head', value: value('remote-head') })
    const entry = sender.logEntries.get('remote-head')
    const broadcast = async () => {
      await Promise.all(
        events.listeners('update').map(listener => (listener as (entry: unknown) => Promise<void>)(entry))
      )
    }
    await broadcast()
    expect(sender.onConsume).toHaveBeenCalledTimes(1)
    expect(receiver.onConsume).not.toHaveBeenCalled()
    expect(receiver.ids).not.toHaveBeenCalled()
    expect(receiver.logReads).toEqual({ has: 1, get: 0 })
    expect(await receiver.store.getEntries(['remote-head'])).toEqual([])

    receiver.save({ hash: 'remote-head', value: value('remote-head') })
    await broadcast()
    expect(sender.onConsume).toHaveBeenCalledTimes(1)
    expect(receiver.onConsume).toHaveBeenCalledTimes(1)
    expect(receiver.ids.mock.lastCall?.[0].ids).toEqual(['remote-head'])
    expect(receiver.logReads).toEqual({ has: 2, get: 1 })
  })

  it('consumes canonical accepted entries instead of payload or ancestry supplied by an update', async () => {
    const events = new EventEmitter()
    const { store, save, onConsume, ids, logReads } = createStore(events)
    await store.subscribe()
    save({ hash: 'canonical-ancestor', value: value('canonical-ancestor') })
    save({ hash: 'canonical-head', value: value('canonical-head'), next: ['canonical-ancestor'] })
    const supplied = {
      hash: 'canonical-head',
      payload: { value: value('forged-event-message') },
      next: ['nonexistent-event-ancestor'],
    }
    await (events.listeners('update')[0] as (entry: unknown) => Promise<void>)(supplied)
    expect(onConsume.mock.calls.map(([message]) => message.id)).toEqual(['canonical-ancestor', 'canonical-head'])
    expect(ids.mock.lastCall?.[0].ids).toEqual(['canonical-ancestor', 'canonical-head'])
    expect(logReads).toEqual({ has: 2, get: 2 })
    expect(await store.getEntries(['forged-event-message'])).toEqual([])
  })

  it('defers a snapshot head published before its local append enters the log index', async () => {
    const { store, auth, save, announce, onConsume, ids, logEntries, logReads } = createStore()
    await store.subscribe()
    save({ hash: 'previous', value: value('previous') })
    await announce('previous')
    onConsume.mockClear()
    ids.mockClear()
    logReads.has = 0
    logReads.get = 0
    const pendingHead = {
      hash: 'pending-append',
      payload: { value: value('pending-append') },
      next: ['previous'],
    }
    // Log.append sets heads before awaiting entry/index.put. Hold that write pending while
    // auth reconciliation reads the new head, then finish it before the local update event.
    // A head the log itself reports may be read from its bytes; here they are not written yet.
    const log = (store as any).store.log
    log.heads = async () => [pendingHead]
    auth.emit(SigchainEvents.UPDATED)
    await (store as any).messageIndexRefresh
    await new Promise(resolve => setImmediate(resolve))
    expect(onConsume).not.toHaveBeenCalled()
    expect(logReads).toEqual({ has: 1, get: 1 })
    expect(ids.mock.lastCall?.[0].ids).toEqual([])
    save({ hash: pendingHead.hash, value: pendingHead.payload.value, next: pendingHead.next })
    expect(logEntries.has(pendingHead.hash)).toBe(true)
    await announce(pendingHead.hash)
    expect(onConsume.mock.calls.map(([message]) => message.id)).toEqual(['previous', 'pending-append'])
    expect(ids.mock.lastCall?.[0].ids).toEqual(['previous', 'pending-append'])
    expect(logReads).toEqual({ has: 3, get: 3 })
  })

  it('indexes a head the log reports from its bytes when the log index lags behind heads()', async () => {
    // Log.append persists heads, then entry bytes, then the index entry. A process killed in
    // between leaves a head that heads() and the iterator show but has() denies. It must not be
    // skipped by the rebuild, or the message would never be announced.
    const { store, save, onConsume, ids, logReads } = createStore()
    save({ hash: 'previous', value: value('previous') })
    save({ hash: 'unindexed-head', value: value('unindexed-head'), next: ['previous'] })
    const log = (store as any).store.log
    const has = log.has
    log.has = async (hash: string) => (await has(hash)) && hash !== 'unindexed-head'
    await store.subscribe()
    expect(new Set(onConsume.mock.calls.map(([message]) => message.id))).toEqual(
      new Set(['previous', 'unindexed-head'])
    )
    expect(new Set(ids.mock.lastCall?.[0].ids)).toEqual(new Set(['previous', 'unindexed-head']))
    expect(logReads).toEqual({ has: 2, get: 2 })
    expect((await store.getEntries(['unindexed-head'])).map(message => message.id)).toEqual(['unindexed-head'])
  })

  it('indexes every missed message when only the joined head emits an update', async () => {
    const { store, save, announce, onConsume, ids, reads, logReads } = createStore()
    const delivered = jest.fn<(payload: { messages: { id: string }[] }) => void>()
    store.on(StorageEvents.MESSAGES_STORED, delivered)
    await store.subscribe()
    save({ hash: 'oldest', value: value('oldest') })
    save({ hash: 'middle', value: value('middle'), next: ['oldest'] })
    save({ hash: 'head', value: value('head'), next: ['middle'] })
    await announce('head')
    expect(onConsume.mock.calls.map(([message]) => message.id)).toEqual(['oldest', 'middle', 'head'])
    expect(ids.mock.lastCall?.[0].ids).toEqual(['oldest', 'middle', 'head'])
    expect(delivered.mock.calls.flatMap(([payload]) => payload.messages.map((message: any) => message.id))).toEqual([
      'head',
    ])
    expect(logReads).toEqual({ has: 3, get: 3 })
    expect((await store.getEntries(['oldest'])).map(message => message.id)).toEqual(['oldest'])
    expect(reads).toEqual({ iterator: 0, get: 1 })
  })

  it('shares one ancestry walk across 100 concurrent heads on a 1,000-entry backlog', async () => {
    const { store, save, announce, onConsume, ids, reads, logReads } = createStore()
    await store.subscribe()
    for (let n = 0; n < 1000; n++) {
      save({ hash: `old-${n}`, value: value(`old-${n}`), next: n === 0 ? [] : [`old-${n - 1}`] })
    }
    for (let n = 0; n < 100; n++) save({ hash: `head-${n}`, value: value(`head-${n}`), next: ['old-999'] })
    await Promise.all(Array.from({ length: 100 }, (_, n) => announce(`head-${n}`)))
    expect(onConsume).toHaveBeenCalledTimes(1100)
    expect(new Set(ids.mock.calls.flatMap(([event]) => event.ids))).toHaveProperty('size', 1100)
    expect(logReads).toEqual({ has: 1100, get: 1100 })
    expect(reads.iterator).toBe(0)
    await announce('head-0')
    expect(onConsume).toHaveBeenCalledTimes(1100)
    expect(logReads).toEqual({ has: 1100, get: 1100 })
  })

  it('walks branching next ancestry once and does not expose a refs-only branch', async () => {
    const { store, save, announce, onConsume, ids } = createStore()
    await store.subscribe()
    save({ hash: 'base', value: value('base') })
    save({ hash: 'left', value: value('left'), next: ['base'] })
    save({ hash: 'right', value: value('right'), next: ['base'] })
    save({ hash: 'refs-only', value: value('refs-only') })
    save({ hash: 'head', value: value('head'), next: ['left', 'right'], refs: ['refs-only'] })
    await announce('head')
    expect(onConsume).toHaveBeenCalledTimes(4)
    expect(new Set(ids.mock.lastCall?.[0].ids)).toEqual(new Set(['base', 'left', 'right', 'head']))
    expect(await store.getEntries(['refs-only'])).toEqual([])
  })

  it('remembers rejected ancestors within an epoch but retries them after an auth update', async () => {
    const { store, auth, save, announce, onConsume, ids, append } = createStore()
    let allowed = false
    onConsume.mockImplementation(async message =>
      message.id === 'pending' && !allowed ? false : { ...message, verified: true }
    )
    await store.subscribe()
    save({ hash: 'pending', value: value('pending') })
    save({ hash: 'head', value: value('head'), next: ['pending'] })
    await announce('head')
    for (let n = 0; n < 10; n++) await append(`later-${n}`)
    expect(onConsume.mock.calls.filter(([message]) => message.id === 'pending')).toHaveLength(1)
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).not.toContain('pending')
    allowed = true
    auth.emit(SigchainEvents.UPDATED)
    await new Promise(resolve => setImmediate(resolve))
    expect(onConsume.mock.calls.filter(([message]) => message.id === 'pending')).toHaveLength(2)
    expect(ids.mock.lastCall?.[0].ids).toContain('pending')
  })

  it('discards old-epoch ancestry consumes and rechecks the current graph', async () => {
    const { store, auth, save, announce, onConsume, ids } = createStore()
    await store.subscribe()
    save({ hash: 'ancestor', value: value('ancestor') })
    save({ hash: 'head', value: value('head'), next: ['ancestor'] })
    let resume!: () => void
    const paused = new Promise<void>(resolve => {
      resume = resolve
    })
    onConsume.mockImplementationOnce(async message => {
      await paused
      return { ...message, verified: true }
    })
    onConsume.mockImplementation(async () => false)
    const arrival = announce('head')
    await new Promise(resolve => setImmediate(resolve))
    auth.emit(SigchainEvents.UPDATED)
    await new Promise(resolve => setImmediate(resolve))
    resume()
    await arrival
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).toEqual([])
    onConsume.mockImplementation(async message => ({ ...message, verified: true }))
    auth.emit(SigchainEvents.UPDATED)
    await new Promise(resolve => setImmediate(resolve))
    expect(new Set(ids.mock.lastCall?.[0].ids)).toEqual(new Set(['ancestor', 'head']))
  })

  it('does not announce an old delta when auth changes during ID reconciliation', async () => {
    const { store, auth, onConsume, ids, append } = createStore()
    let allowed = true
    onConsume.mockImplementation(async message => (allowed ? { ...message, verified: true } : false))
    await store.subscribe()
    const ensure = jest.spyOn(store as any, 'ensureMessageIndex')
    ensure.mockImplementationOnce(async () => {
      allowed = false
      auth.emit(SigchainEvents.UPDATED)
      await new Promise(resolve => setImmediate(resolve))
    })
    try {
      await append('revoked-before-announcement')
      expect(ids.mock.calls.flatMap(([event]) => event.ids)).toEqual([])
    } finally {
      ensure.mockRestore()
    }
  })

  it('ignores a stale ancestor read rejection after the store closes and reopens', async () => {
    const { store, save, announce, ids } = createStore()
    await store.subscribe()
    save({ hash: 'ancestor', value: value('ancestor') })
    save({ hash: 'head', value: value('head'), next: ['ancestor'] })
    let reject!: (error: Error) => void
    const paused = new Promise<never>((_resolve, rejectPromise) => {
      reject = rejectPromise
    })
    const log = (store as any).store.log
    const get = log.get
    log.get = async (hash: string) => (hash === 'ancestor' ? paused : get(hash))
    const arrival = announce('head')
    await new Promise(resolve => setImmediate(resolve))
    await store.close()
    const replacement = createStore()
    replacement.save({ hash: 'replacement', value: value('replacement') })
    Object.assign(store, { store: (replacement.store as any).store, closing: false })
    await store.subscribe()
    reject(new Error('Old log is closed'))
    await arrival
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).toEqual(['replacement'])
  })

  it('does not treat an unavailable or unjoined ancestor as completed ancestry', async () => {
    const { store, save, announce, onConsume, ids, logReads } = createStore()
    await store.subscribe()
    save({ hash: 'good', value: value('good') })
    save({ hash: 'head', value: value('head'), next: ['missing', 'good'] })
    // The listener runs un-awaited on a shared bus: a rejection here would be an
    // unhandledRejection, which backendManager answers with a full shutdown.
    await expect(announce('head')).resolves.toBeUndefined()
    expect(onConsume).toHaveBeenCalledTimes(1)
    expect(logReads.get).toBe(2) // Never fetch an unjoined block, even if it is available.
    expect(ids.mock.calls.flatMap(([event]) => event.ids)).toEqual(['good'])
    save({ hash: 'missing', value: value('missing') })
    await announce('head')
    expect(onConsume).toHaveBeenCalledTimes(4)
    expect(new Set(ids.mock.lastCall?.[0].ids)).toEqual(new Set(['good', 'missing', 'head']))
  })

  it('retries an unreadable ancestor in the background and announces it once it can be read', async () => {
    const { store, save, announce, onConsume, ids } = createStore()
    ;(store as any).retryDelayMs = 1
    await store.subscribe()
    save({ hash: 'good', value: value('good') })
    save({ hash: 'head', value: value('head'), next: ['missing', 'good'] })
    await announce('head')
    expect(store.isSubscribing).toBe(false)
    save({ hash: 'missing', value: value('missing') })
    await waitFor(() => ids.mock.calls.some(([event]) => event.ids.includes('head')))
    expect(new Set(ids.mock.lastCall?.[0].ids)).toEqual(new Set(['good', 'missing', 'head']))
    expect(onConsume.mock.calls.filter(([message]) => message.id === 'head')).toHaveLength(1)
    expect((await store.getEntries(['missing'])).map(message => message.id)).toEqual(['missing'])
  })

  it('subscribes when the initial rebuild cannot read an ancestor, then indexes it on retry', async () => {
    const { store, save, ids } = createStore()
    ;(store as any).retryDelayMs = 1
    save({ hash: 'head', value: value('head'), next: ['missing'] })
    await expect(store.subscribe()).resolves.toBeUndefined()
    expect(store.isSubscribing).toBe(false)
    // Ancestors are consumed before their descendants, so nothing is announced yet.
    expect(ids.mock.lastCall?.[0].ids).toEqual([])
    save({ hash: 'missing', value: value('missing') })
    await waitFor(() => ids.mock.calls.some(([event]) => event.ids.includes('head')))
    expect(new Set(ids.mock.lastCall?.[0].ids)).toEqual(new Set(['missing', 'head']))
    expect((await store.getEntries(['missing'])).map(message => message.id)).toEqual(['missing'])
  })

  it('never rejects the shared update listener when a log read fails, and retries the head', async () => {
    const { store, save, announce, ids } = createStore()
    ;(store as any).retryDelayMs = 1
    await store.subscribe()
    save({ hash: 'flaky', value: value('flaky') })
    const log = (store as any).store.log
    const get = log.get
    let failures = 1
    log.get = async (hash: string) => {
      if (failures-- > 0) throw new Error('entry storage read failed')
      return get(hash)
    }
    await expect(announce('flaky')).resolves.toBeUndefined()
    await waitFor(() => ids.mock.calls.some(([event]) => event.ids.includes('flaky')))
  })

  it('announces an arrival exactly once when an auth update interrupts its walk', async () => {
    const { store, auth, append, onConsume } = createStore()
    const delivered = jest.fn<(payload: { messages: { id: string }[] }) => void>()
    store.on(StorageEvents.MESSAGES_STORED, delivered)
    await store.subscribe()
    let resume!: () => void
    const paused = new Promise<void>(resolve => {
      resume = resolve
    })
    onConsume.mockImplementationOnce(async message => {
      await paused
      return { ...message, verified: true }
    })
    const arrival = append('interrupted')
    await new Promise(resolve => setImmediate(resolve))
    auth.emit(SigchainEvents.UPDATED)
    resume()
    await arrival
    await waitFor(() => delivered.mock.calls.length > 0)
    await new Promise(resolve => setImmediate(resolve))
    expect(delivered.mock.calls.flatMap(([payload]) => payload.messages.map(message => message.id))).toEqual([
      'interrupted',
    ])
  })

  it('announces each concurrent head once even when an earlier walk indexed it', async () => {
    const { store, save, announce, onConsume } = createStore()
    const delivered = jest.fn<(payload: { messages: { id: string }[] }) => void>()
    store.on(StorageEvents.MESSAGES_STORED, delivered)
    await store.subscribe()
    save({ hash: 'older', value: value('older') })
    save({ hash: 'newer', value: value('newer'), next: ['older'] })
    await Promise.all([announce('newer'), announce('older')])
    expect(onConsume).toHaveBeenCalledTimes(2)
    expect(delivered.mock.calls.flatMap(([payload]) => payload.messages.map(message => message.id)).sort()).toEqual([
      'newer',
      'older',
    ])
  })

  describe('sigchain updates', () => {
    type FakeMember = { userId: string; roles: string[]; keys?: { generation: number } }
    const chainWith = (members: FakeMember[], localUserId = 'self') => ({
      user: { userId: localUserId },
      team: { members: () => members },
    })
    const authored = (id: string, userId: string) => ({ id, channelId: 'general', teamId: 'team', userId })

    const setup = async (members: FakeMember[]) => {
      const fixture = createStore()
      fixture.auth.getActiveChain = () => chainWith(members)
      await fixture.store.subscribe()
      return fixture
    }

    it('keeps checked consumes when a sigchain update only admits a new member', async () => {
      const members = [
        { userId: 'self', roles: ['member'] },
        { userId: 'alice', roles: ['member'] },
      ]
      const { store, auth, append, onConsume, ids, reads } = await setup(members)
      for (let n = 0; n < 50; n++) await append(`alice-${n}`, `alice-${n}`, authored(`alice-${n}`, 'alice'))
      onConsume.mockClear()
      ids.mockClear()
      auth.getActiveChain = () => chainWith([...members, { userId: 'bob', roles: ['member'] }])
      auth.emit(SigchainEvents.UPDATED)
      await new Promise(resolve => setImmediate(resolve))
      expect(onConsume).not.toHaveBeenCalled()
      expect(ids.mock.lastCall?.[0].ids).toHaveLength(50)
      expect((await store.getEntries(['alice-7'])).map(message => message.id)).toEqual(['alice-7'])
      expect(reads.iterator).toBe(0)
    })

    it('rechecks only the messages of a member whose keys or roles changed', async () => {
      const members = [
        { userId: 'self', roles: ['member'] },
        { userId: 'alice', roles: ['member'], keys: { generation: 0 } },
        { userId: 'carol', roles: ['member'], keys: { generation: 0 } },
      ]
      const { store, auth, append, onConsume, ids } = await setup(members)
      for (let n = 0; n < 5; n++) {
        await append(`alice-${n}`, `alice-${n}`, authored(`alice-${n}`, 'alice'))
        await append(`carol-${n}`, `carol-${n}`, authored(`carol-${n}`, 'carol'))
      }
      onConsume.mockClear()
      onConsume.mockImplementation(async message =>
        message.userId === 'carol' ? false : { ...message, verified: true }
      )
      auth.getActiveChain = () =>
        chainWith([members[0], members[1], { userId: 'carol', roles: ['member'], keys: { generation: 1 } }])
      auth.emit(SigchainEvents.UPDATED)
      await new Promise(resolve => setImmediate(resolve))
      expect(onConsume.mock.calls.map(([message]) => message.userId)).toEqual(Array(5).fill('carol'))
      expect(new Set(ids.mock.lastCall?.[0].ids)).toEqual(new Set(Array.from({ length: 5 }, (_, n) => `alice-${n}`)))
      expect(await store.getEntries(['carol-2'])).toEqual([])
      expect((await store.getEntries(['alice-2'])).map(message => message.id)).toEqual(['alice-2'])
    })

    it('retries rejected entries on a sigchain update without rewalking accepted history', async () => {
      const members = [
        { userId: 'self', roles: ['member'] },
        { userId: 'alice', roles: ['member'] },
      ]
      const { store, auth, append, onConsume, ids } = await setup(members)
      let allowed = false
      onConsume.mockImplementation(async message =>
        message.id === 'locked' && !allowed ? undefined : { ...message, verified: true }
      )
      await append('locked', 'locked', authored('locked', 'alice'))
      for (let n = 0; n < 20; n++) await append(`open-${n}`, `open-${n}`, authored(`open-${n}`, 'alice'))
      expect(ids.mock.calls.flatMap(([event]) => event.ids)).not.toContain('locked')
      onConsume.mockClear()
      allowed = true
      auth.emit(SigchainEvents.UPDATED)
      await new Promise(resolve => setImmediate(resolve))
      expect(onConsume.mock.calls.map(([message]) => message.id)).toEqual(['locked'])
      expect(ids.mock.lastCall?.[0].ids).toContain('locked')
      expect((await store.getEntries(['locked'])).map(message => message.id)).toEqual(['locked'])
    })

    it("rebuilds the whole index when the local user's own authorization changes", async () => {
      const members = [
        { userId: 'self', roles: ['member'] },
        { userId: 'alice', roles: ['member'] },
      ]
      const { auth, append, onConsume } = await setup(members)
      for (let n = 0; n < 10; n++) await append(`alice-${n}`, `alice-${n}`, authored(`alice-${n}`, 'alice'))
      onConsume.mockClear()
      auth.getActiveChain = () => chainWith([{ userId: 'self', roles: ['member', 'admin'] }, members[1]])
      auth.emit(SigchainEvents.UPDATED)
      await new Promise(resolve => setImmediate(resolve))
      expect(onConsume).toHaveBeenCalledTimes(10)
    })
  })

  describe('audit regressions (Daybreak iteration 1)', () => {
    type FakeMember = { userId: string; roles: string[]; keys?: { generation: number } }
    const chainWith = (members: FakeMember[]) => ({ user: { userId: 'self' }, team: { members: () => members } })
    const authored = (id: string, userId: string) => ({ id, channelId: 'general', teamId: 'team', userId })
    const self = { userId: 'self', roles: ['member'] }
    const alice = (generation: number) => ({ userId: 'alice', roles: ['member'], keys: { generation } })
    const bob = { userId: 'bob', roles: ['member'] }

    it('M-1: rechecks an affected author even when a later update supersedes the running recheck', async () => {
      const { store, auth, append, onConsume, ids } = createStore()
      auth.getActiveChain = () => chainWith([self, alice(0)])
      await store.subscribe()
      await append('a1', 'a1', authored('a1', 'alice'))
      await append('a2', 'a2', authored('a2', 'alice'))
      onConsume.mockClear()
      let resume!: () => void
      const paused = new Promise<void>(resolve => {
        resume = resolve
      })
      onConsume.mockImplementationOnce(async message => {
        await paused
        return { ...message, verified: true }
      })
      onConsume.mockImplementation(async message =>
        message.userId === 'alice' ? false : { ...message, verified: true }
      )
      auth.getActiveChain = () => chainWith([self, alice(1)])
      auth.emit(SigchainEvents.UPDATED)
      await waitFor(() => onConsume.mock.calls.length === 1)
      // A second, unrelated update lands while Alice's recheck is paused on her first entry.
      auth.getActiveChain = () => chainWith([self, alice(1), bob])
      auth.emit(SigchainEvents.UPDATED)
      resume()
      await waitFor(() => ids.mock.calls.length > 2 && !ids.mock.lastCall![0].ids.includes('a2'))
      // Both of Alice's entries were rechecked: a1 passed its (paused) recheck and stays, a2 was
      // rejected and is gone. Before the fix the second update's diff no longer named Alice, so a2
      // was never rechecked.
      expect(new Set(onConsume.mock.calls.map(([message]) => message.id))).toEqual(new Set(['a1', 'a2']))
      expect(ids.mock.lastCall?.[0].ids).toEqual(['a1'])
      expect((store as any).indexedEntries.has('a2')).toBe(false)
      expect((store as any).dirtyAuthors.size).toBe(0)
    })

    it('M-1: repeats a recheck that failed on a log read instead of forgetting the affected author', async () => {
      const { store, auth, append, onConsume, ids } = createStore()
      ;(store as any).retryDelayMs = 1
      auth.getActiveChain = () => chainWith([self, alice(0)])
      await store.subscribe()
      await append('a1', 'a1', authored('a1', 'alice'))
      await append('a2', 'a2', authored('a2', 'alice'))
      onConsume.mockClear()
      onConsume.mockImplementation(async message =>
        message.userId === 'alice' ? false : { ...message, verified: true }
      )
      const log = (store as any).store.log
      const get = log.get
      let failures = 1
      log.get = async (hash: string) => {
        if (failures-- > 0) throw new Error('entry storage read failed')
        return get(hash)
      }
      auth.getActiveChain = () => chainWith([self, alice(1)])
      auth.emit(SigchainEvents.UPDATED)
      await waitFor(() => ids.mock.calls.length > 2 && ids.mock.lastCall![0].ids.length === 0)
      expect(await store.getEntries(['a1', 'a2'])).toEqual([])
      expect((store as any).dirtyAuthors.size).toBe(0)
    })

    it('M-2: keeps a joined head whose bytes are not readable yet and indexes it once they are', async () => {
      const { store, save, announce, onConsume, ids, logEntries } = createStore()
      const delivered = jest.fn<(payload: { messages: { id: string }[] }) => void>()
      store.on(StorageEvents.MESSAGES_STORED, delivered)
      ;(store as any).retryDelayMs = 1
      await store.subscribe()
      save({ hash: 'lagging', value: value('lagging') })
      const log = (store as any).store.log
      const get = log.get
      log.get = async (hash: string) => (hash === 'lagging' && !readable ? undefined : get(hash))
      let readable = false
      await announce('lagging')
      expect(onConsume).not.toHaveBeenCalled()
      expect((store as any).pendingHeads.has('lagging')).toBe(true)
      expect((store as any).retryTimer).toBeDefined()
      readable = true
      await waitFor(() => ids.mock.calls.some(([event]) => event.ids.includes('lagging')))
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(onConsume).toHaveBeenCalledTimes(1)
      expect(delivered.mock.calls.flatMap(([payload]) => payload.messages.map(message => message.id))).toEqual([
        'lagging',
      ])
      expect(logEntries.has('lagging')).toBe(true)
    })

    it('M-2: keeps a head the log reports whose bytes are not readable yet, instead of dropping it', async () => {
      const { store, save, onConsume, ids } = createStore()
      ;(store as any).retryDelayMs = 1
      save({ hash: 'lagging', value: value('lagging') })
      const log = (store as any).store.log
      const has = log.has
      const get = log.get
      let readable = false
      log.has = async (hash: string) => hash !== 'lagging' && has(hash)
      log.get = async (hash: string) => (hash === 'lagging' && !readable ? undefined : get(hash))
      await store.subscribe()
      expect(onConsume).not.toHaveBeenCalled()
      expect(ids.mock.lastCall?.[0].ids).toEqual([])
      expect((store as any).pendingHeads.has('lagging')).toBe(true)
      readable = true
      await waitFor(() => ids.mock.calls.some(([event]) => event.ids.includes('lagging')))
      expect(onConsume).toHaveBeenCalledTimes(1)
    })

    it('M-3: still announces an arrival when auth is invalidated after its walk commits but before publication', async () => {
      const { store, save, announce, onConsume } = createStore()
      const delivered = jest.fn<(payload: { messages: { id: string }[] }) => void>()
      store.on(StorageEvents.MESSAGES_STORED, delivered)
      await store.subscribe()
      save({ hash: 'boundary', value: value('boundary') })
      const publish = (store as any).publishWalk.bind(store)
      ;(store as any).publishWalk = async (result: unknown, epoch: number) => {
        ;(store as any).publishWalk = publish
        ;(store as any).invalidateMessageIndex()
        await publish(result, epoch)
        await (store as any).refreshMessageIds()
      }
      await announce('boundary')
      await waitFor(() => delivered.mock.calls.length > 0)
      await new Promise(resolve => setImmediate(resolve))
      expect(delivered.mock.calls.flatMap(([payload]) => payload.messages.map(message => message.id))).toEqual([
        'boundary',
      ])
      expect(onConsume).toHaveBeenCalledTimes(2)
      expect((store as any).pendingHeads.has('boundary')).toBe(false)
    })

    it('M-3: retries an announcement whose listener threw, exactly once more', async () => {
      const { store, append } = createStore()
      ;(store as any).retryDelayMs = 1
      const seen: string[] = []
      let failures = 1
      store.on(StorageEvents.MESSAGES_STORED, payload => {
        if (failures-- > 0) throw new Error('listener failed')
        seen.push(...payload.messages.map((message: { id: string }) => message.id))
      })
      await store.subscribe()
      await append('fragile')
      await waitFor(() => seen.length > 0)
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(seen).toEqual(['fragile'])
      expect((store as any).pendingHeads.has('fragile')).toBe(false)
    })

    it('L-1: ignores sigchain updates for other teams and coalesces a burst into one recheck', async () => {
      const { store, auth, append, onConsume } = createStore()
      auth.getActiveChain = () => chainWith([self, alice(0)])
      await store.subscribe()
      await append('a1', 'a1', authored('a1', 'alice'))
      onConsume.mockClear()
      auth.getActiveChain = () => chainWith([self, alice(1)])
      auth.emit(SigchainEvents.UPDATED, 'another-team')
      await new Promise(resolve => setImmediate(resolve))
      expect(onConsume).not.toHaveBeenCalled()
      for (let n = 0; n < 5; n++) auth.emit(SigchainEvents.UPDATED, 'team')
      await waitFor(() => onConsume.mock.calls.length > 0)
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(onConsume).toHaveBeenCalledTimes(1)
    })

    it('L-3: survives a non-Error rejection while rebuilding after an auth update', async () => {
      const { store, auth, append } = createStore()
      await store.subscribe()
      await append('m')
      const unhandled = jest.fn()
      process.on('unhandledRejection', unhandled)
      try {
        ;(store as any).localDbService = { getCurrentCommunity: async () => Promise.reject('no db') }
        auth.emit(SigchainEvents.UPDATED)
        await new Promise(resolve => setTimeout(resolve, 20))
        expect(unhandled).not.toHaveBeenCalled()
      } finally {
        process.off('unhandledRejection', unhandled)
      }
    })
  })

  describe('audit regressions (Daybreak iteration 2)', () => {
    type FakeMember = { userId: string; roles: string[]; keys?: { generation: number } }
    const chainWith = (members: FakeMember[]) => ({ user: { userId: 'self' }, team: { members: () => members } })
    const authored = (id: string, userId: string) => ({ id, channelId: 'general', teamId: 'team', userId })
    const self = { userId: 'self', roles: ['member'] }
    const alice = (generation: number) => ({ userId: 'alice', roles: ['member'], keys: { generation } })
    const messageIds = (payload: { messages: { id: string }[] }) => payload.messages.map(message => message.id)
    const pause = () => {
      let resume!: () => void
      const paused = new Promise<void>(resolve => {
        resume = resolve
      })
      return { paused, resume }
    }
    const settle = () => new Promise(resolve => setTimeout(resolve, 20))

    it.each(['rejected', 'accepted'] as const)(
      "M-1: never announces a walk consumed under an author's superseded facts; announces the %s current result once",
      async outcome => {
        const { store, auth, append, onConsume } = createStore()
        ;(store as any).retryDelayMs = 1
        const delivered = jest.fn<(payload: { messages: { id: string; consumedUnder: number }[] }) => void>()
        store.on(StorageEvents.MESSAGES_STORED, delivered)
        let generation = 0
        auth.getActiveChain = () => chainWith([self, alice(generation)])
        await store.subscribe()
        const { paused, resume } = pause()
        onConsume.mockImplementation(async message => {
          const consumedUnder = generation
          if (consumedUnder === 0) await paused
          if (consumedUnder === 1 && outcome === 'rejected') return false
          return { ...message, verified: true, consumedUnder }
        })
        const arrival = append('a1', 'a1', authored('a1', 'alice'))
        await waitFor(() => onConsume.mock.calls.length === 1)
        // Alice's keys rotate while her message is being consumed under the old ones.
        generation = 1
        auth.emit(SigchainEvents.UPDATED)
        resume()
        await arrival
        await waitFor(() => (store as any).dirtyAuthors.size === 0)
        await settle()
        if (outcome === 'accepted') {
          expect(delivered.mock.calls.map(([payload]) => payload.messages.map(m => [m.id, m.consumedUnder]))).toEqual([
            [['a1', 1]],
          ])
          expect(onConsume).toHaveBeenCalledTimes(2)
        } else {
          expect(delivered).not.toHaveBeenCalled()
          expect((store as any).indexedEntries.has('a1')).toBe(false)
          expect(await store.getEntries(['a1'])).toEqual([])
        }
        expect((store as any).pendingHeads.size).toBe(0)
      }
    )

    it('M-1: rechecks an author again when their facts change during their own running recheck', async () => {
      const { store, auth, append, onConsume, ids } = createStore()
      let generation = 0
      auth.getActiveChain = () => chainWith([self, alice(generation)])
      await store.subscribe()
      await append('a1', 'a1', authored('a1', 'alice'))
      await append('a2', 'a2', authored('a2', 'alice'))
      onConsume.mockClear()
      const { paused, resume } = pause()
      let pauses = 1
      onConsume.mockImplementation(async message => {
        const consumedUnder = generation
        if (message.id === 'a2' && pauses-- > 0) await paused
        return consumedUnder >= 2 ? false : { ...message, verified: true }
      })
      generation = 1
      auth.emit(SigchainEvents.UPDATED)
      await waitFor(() => onConsume.mock.calls.length === 2)
      // Alice changes again while her generation-1 recheck is paused on her second entry.
      generation = 2
      auth.emit(SigchainEvents.UPDATED)
      resume()
      await waitFor(() => onConsume.mock.calls.length === 4)
      await waitFor(() => ids.mock.lastCall?.[0].ids.length === 0)
      expect(onConsume.mock.calls.map(([message]) => message.id)).toEqual(['a1', 'a2', 'a1', 'a2'])
      expect(await store.getEntries(['a1', 'a2'])).toEqual([])
      expect((store as any).dirtyAuthors.size).toBe(0)
      expect((store as any).authRecheckNeeded).toBe(false)
    })

    it('M-2: delivers a DM to every listener exactly once when its first listener throws', async () => {
      const { store, append } = createStore()
      ;(store as any).channelData = { ...(store as any).channelData, type: ChannelType.DM }
      ;(store as any).retryDelayMs = 1
      const first: string[] = []
      const second: string[] = []
      let failures = 1
      store.on(StorageEvents.MESSAGES_STORED, payload => {
        if (failures-- > 0) throw new Error('first listener failed')
        first.push(...messageIds(payload))
      })
      store.on(StorageEvents.MESSAGES_STORED, payload => second.push(...messageIds(payload)))
      await store.subscribe()
      await append('dm-1', 'dm-1', authored('dm-1', 'alice'))
      await waitFor(() => first.length > 0)
      await settle()
      expect(first).toEqual(['dm-1'])
      expect(second).toEqual(['dm-1'])
      expect((store as any).pendingHeads.size).toBe(0)
      expect((store as any).deliveredDmIds.has('dm-1')).toBe(true)
    })

    it('M-2: retries an announcement whose listener threw while an auth recheck was publishing it', async () => {
      const { store, auth, append, onConsume } = createStore()
      ;(store as any).retryDelayMs = 1
      let generation = 0
      auth.getActiveChain = () => chainWith([self, alice(generation)])
      const seen: string[] = []
      // Two failures: whichever earlier publication a retry timer already covers, the recheck's
      // own publication still fails once and must schedule its own retry.
      let failures = 2
      store.on(StorageEvents.MESSAGES_STORED, payload => {
        if (failures-- > 0) throw new Error('listener failed')
        seen.push(...messageIds(payload))
      })
      await store.subscribe()
      const { paused, resume } = pause()
      onConsume.mockImplementationOnce(async message => {
        await paused
        return { ...message, verified: true }
      })
      const arrival = append('a1', 'a1', authored('a1', 'alice'))
      await waitFor(() => onConsume.mock.calls.length === 1)
      // The first recheck fails on a log read, so the retry timer is the one that publishes.
      const log = (store as any).store.log
      const get = log.get
      let readFailures = 1
      log.get = async (hash: string) => {
        if (readFailures-- > 0) throw new Error('entry storage read failed')
        return get(hash)
      }
      generation = 1
      auth.emit(SigchainEvents.UPDATED)
      resume()
      await arrival
      await waitFor(() => seen.length > 0)
      await settle()
      expect(seen).toEqual(['a1'])
      expect((store as any).pendingHeads.size).toBe(0)
    })

    it('M-2: retries an announcement whose listener threw while a rebuild was publishing it', async () => {
      const { store, auth, append, onConsume } = createStore()
      ;(store as any).retryDelayMs = 1
      let admin = false
      auth.getActiveChain = () =>
        chainWith([{ userId: 'self', roles: admin ? ['member', 'admin'] : ['member'] }, alice(0)])
      const seen: string[] = []
      let failures = 1
      store.on(StorageEvents.MESSAGES_STORED, payload => {
        if (failures-- > 0) throw new Error('listener failed')
        seen.push(...messageIds(payload))
      })
      await store.subscribe()
      const { paused, resume } = pause()
      onConsume.mockImplementationOnce(async message => {
        await paused
        return { ...message, verified: true }
      })
      const arrival = append('m', 'm', authored('m', 'alice'))
      await waitFor(() => onConsume.mock.calls.length === 1)
      // The local user's own roles change: the index is rebuilt and the rebuild announces 'm'.
      admin = true
      auth.emit(SigchainEvents.UPDATED)
      resume()
      await arrival
      await waitFor(() => seen.length > 0)
      await settle()
      expect(seen).toEqual(['m'])
      expect((store as any).pendingHeads.size).toBe(0)
    })

    it('L-2: a retry after a partially failed announcement reaches only the listener that failed', async () => {
      const { store, append } = createStore()
      ;(store as any).retryDelayMs = 1
      const first: string[] = []
      const second: string[] = []
      let failures = 1
      store.on(StorageEvents.MESSAGES_STORED, payload => first.push(...messageIds(payload)))
      store.on(StorageEvents.MESSAGES_STORED, payload => {
        if (failures-- > 0) throw new Error('second listener failed')
        second.push(...messageIds(payload))
      })
      await store.subscribe()
      await append('m')
      await waitFor(() => second.length > 0)
      await settle()
      expect(first).toEqual(['m'])
      expect(second).toEqual(['m'])
      expect((store as any).pendingHeads.size).toBe(0)
    })

    it('L-2: a failing push listener is retried without repeating MESSAGES_STORED', async () => {
      const previousBackend = process.env.BACKEND
      const previousConnectionTime = process.env.CONNECTION_TIME
      process.env.BACKEND = 'mobile'
      process.env.CONNECTION_TIME = '0'
      try {
        const { store, append } = createStore()
        ;(store as any).retryDelayMs = 1
        const stored: string[] = []
        const pushed: string[] = []
        let failures = 1
        store.on(StorageEvents.MESSAGES_STORED, payload => stored.push(...messageIds(payload)))
        store.on(StorageEvents.SEND_PUSH_NOTIFICATION, (payload: PushNotificationPayload) => {
          if (failures-- > 0) throw new Error('push listener failed')
          pushed.push(JSON.parse(payload.message).id)
        })
        await store.subscribe()
        await append('m', 'm', { ...authored('m', 'sender'), createdAt: Date.now() })
        await waitFor(() => pushed.length > 0)
        await settle()
        expect(stored).toEqual(['m'])
        expect(pushed).toEqual(['m'])
        expect((store as any).pendingHeads.size).toBe(0)
      } finally {
        if (previousBackend === undefined) delete process.env.BACKEND
        else process.env.BACKEND = previousBackend
        if (previousConnectionTime === undefined) delete process.env.CONNECTION_TIME
        else process.env.CONNECTION_TIME = previousConnectionTime
      }
    })

    it('serves a direct batch fetch under one set of facts, restarting when authorization changes mid-batch', async () => {
      const { store, auth, append, onConsume } = createStore()
      let generation = 0
      auth.getActiveChain = () => chainWith([self, alice(generation)])
      await store.subscribe()
      await append('a1', 'a1', authored('a1', 'alice'))
      await append('a2', 'a2', authored('a2', 'alice'))
      onConsume.mockClear()
      const { paused, resume } = pause()
      let pauses = 1
      onConsume.mockImplementation(async message => {
        const consumedUnder = generation
        if (pauses-- > 0) await paused
        return consumedUnder >= 1 ? false : { ...message, verified: true }
      })
      const fetch = store.getEntries(['a1', 'a2'])
      await waitFor(() => onConsume.mock.calls.length === 1)
      generation = 1
      auth.emit(SigchainEvents.UPDATED)
      resume()
      expect(await fetch).toEqual([])
    })
  })

  it('returns a batch of announced IDs in request order', async () => {
    const { store, append, reads } = createStore()
    await store.subscribe()
    for (let n = 0; n < 5; n++) await append(`message-${n}`)
    const batch = await store.getEntries(['message-4', 'message-1', 'message-4'])
    expect(batch.map(message => message.id)).toEqual(['message-4', 'message-1'])
    expect(reads).toEqual({ iterator: 0, get: 2 })
  })

  it('fetches a batch of announced IDs directly without rescanning history', async () => {
    const { store, append, reads, onConsume } = createStore()
    await store.subscribe()
    for (let n = 0; n < 100; n++) await append(`message-${n}`)
    onConsume.mockClear()
    const batch = await store.getEntries(['message-3', 'message-50', 'message-97', 'unknown'])
    expect(batch.map(message => message.id)).toEqual(['message-3', 'message-50', 'message-97'])
    expect(reads).toEqual({ iterator: 0, get: 3 })
    expect(onConsume).toHaveBeenCalledTimes(3)
  })

  it.each(['close', 'clean'] as const)(
    'detaches its update listener from the shared events bus on %s',
    async method => {
      const events = new EventEmitter()
      const { store } = createStore(events)
      const baseline = events.listenerCount('update')
      await store.subscribe()
      expect(events.listenerCount('update')).toBe(baseline + 1)
      await store.subscribe()
      expect(events.listenerCount('update')).toBe(baseline + 1)
      await store[method]()
      expect(events.listenerCount('update')).toBe(baseline)
    }
  )

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

  it('does not return a direct fetch authorized before an auth epoch change', async () => {
    const { store, auth, onConsume, append } = createStore()
    await store.subscribe()
    await append('revoked-during-fetch')

    let resume!: () => void
    const paused = new Promise<void>(resolve => {
      resume = resolve
    })
    onConsume.mockReset()
    onConsume.mockImplementationOnce(async message => {
      await paused
      return { ...message, verified: true }
    })
    onConsume.mockImplementation(async () => undefined)

    const fetching = store.getEntries(['revoked-during-fetch'])
    await new Promise(resolve => setImmediate(resolve))
    auth.emit(SigchainEvents.UPDATED)
    resume()

    await expect(fetching).resolves.toEqual([])
  })

  it('reconsumes a direct hash fetch instead of treating its indexed ID as authorization', async () => {
    const { store, onConsume, append } = createStore()
    await store.subscribe()
    await append('indexed-but-not-authorized')
    onConsume.mockReset()
    onConsume.mockResolvedValue(undefined)

    await expect(store.getEntries(['indexed-but-not-authorized'])).resolves.toEqual([])
    expect(onConsume).toHaveBeenCalledTimes(1)
  })
})
