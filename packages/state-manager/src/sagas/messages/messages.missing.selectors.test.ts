import { type ChannelMessage, MessageType } from '@quiet/types'
import { channelMessagesAdapter } from '../publicChannels/publicChannels.adapter'
import { StoreKeys } from '../store.keys'
import { type StoreState } from '../store.types'
import { publicChannelsMessagesBaseAdapter } from './messages.adapter.ts'
import { missingChannelMessages } from './messages.selectors'

const channelId = 'history-scaling-test'
const message = (id: string): ChannelMessage => ({
  id,
  channelId,
  userId: 'test-author',
  message: `Message ${id}`,
  type: MessageType.Basic,
  createdAt: 1700000000000,
})

const stateWithMessages = (messages: ReturnType<typeof channelMessagesAdapter.getInitialState>): StoreState =>
  ({
    [StoreKeys.Messages]: {
      publicChannelsMessagesBase: publicChannelsMessagesBaseAdapter.addOne(
        publicChannelsMessagesBaseAdapter.getInitialState(),
        { channelId, messages }
      ),
    },
  }) as StoreState

describe('missingChannelMessages incremental lookup', () => {
  it('keeps missing-ID order and duplicates while matching the correct channel', () => {
    const messages = channelMessagesAdapter.setAll(channelMessagesAdapter.getInitialState(), [message('present')])
    const state = stateWithMessages(messages)
    expect(missingChannelMessages(['absent', 'present', 'absent', 'another'], channelId)(state)).toEqual([
      'absent',
      'absent',
      'another',
    ])
    expect(missingChannelMessages(['present'], 'different-channel')(state)).toEqual([])
    expect(missingChannelMessages([], channelId)(state)).toEqual([])
  })

  it('observes additions and removals without treating object prototype properties as cached messages', () => {
    const select = missingChannelMessages(['present', 'new', 'constructor', '__proto__'], channelId)
    let messages = channelMessagesAdapter.setAll(channelMessagesAdapter.getInitialState(), [message('present')])
    expect(select(stateWithMessages(messages))).toEqual(['new', 'constructor', '__proto__'])
    messages = channelMessagesAdapter.addOne(messages, message('new'))
    messages = channelMessagesAdapter.removeOne(messages, 'present')
    expect(select(stateWithMessages(messages))).toEqual(['present', 'constructor', '__proto__'])
  })

  it.each([1, 10, 100, 1000])('does not rescan %i cached messages for announcements', count => {
    const entries = Array.from({ length: count }, (_, n) => message(`cached-${n}`))
    const messages = channelMessagesAdapter.setAll(channelMessagesAdapter.getInitialState(), entries)
    let historyReads = 0
    let enumerations = 0
    let entityReads = 0
    const measured = {
      ids: new Proxy([...messages.ids], {
        get(target, key, receiver) {
          if (typeof key === 'string' && /^\d+$/.test(key)) historyReads++
          return Reflect.get(target, key, receiver)
        },
      }),
      entities: new Proxy(
        { ...messages.entities },
        {
          get(target, key, receiver) {
            entityReads++
            return Reflect.get(target, key, receiver)
          },
          ownKeys(target) {
            enumerations++
            return Reflect.ownKeys(target)
          },
        }
      ),
    }
    // Build normal adapter state first, then instrument only the selector's reads;
    // Redux/Immer construction itself legitimately inspects the entity collection.
    const base = stateWithMessages(messages)
    const state = {
      ...base,
      [StoreKeys.Messages]: {
        ...base[StoreKeys.Messages],
        publicChannelsMessagesBase: {
          ...base[StoreKeys.Messages].publicChannelsMessagesBase,
          entities: { [channelId]: { channelId, messages: measured } },
        },
      },
    }
    const announced = [...entries.map(entry => entry.id), 'new-message']
    expect(missingChannelMessages(announced, channelId)(state)).toEqual(['new-message'])
    expect(historyReads).toBe(0)
    expect(enumerations).toBe(0)
    expect(entityReads).toBeLessThanOrEqual(2 * announced.length)
  })
})
