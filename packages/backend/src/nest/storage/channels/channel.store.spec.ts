import EventEmitter from 'node:events'
import { jest } from '@jest/globals'

import { ChannelStore } from './channel.store'
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
