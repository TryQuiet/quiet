import EventEmitter from 'node:events'
import { jest } from '@jest/globals'

import { ChannelStore } from './channel.store'
import { StorageEvents } from '../storage.types'
import { ConsumedChannelMessage, MessageType, PushNotificationPayload } from '@quiet/types'

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
      ;(channelStore as any).store = {
        events: storeEvents,
        iterator: async function* () {
          for (const message of messages) yield { hash: message.id, value: message }
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
      expect(storedIds).toHaveBeenLastCalledWith({
        ids: messages.map(item => item.id),
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
