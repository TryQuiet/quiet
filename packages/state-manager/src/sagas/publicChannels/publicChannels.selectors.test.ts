import { setupCrypto } from '@quiet/identity'
import { type Store } from '../store.types'
import { type FactoryGirl } from 'factory-girl'
import { prepareStore, testReducers } from '../../utils/tests/prepareStore'
import {
  publicChannels as getPublicChannels,
  currentChannelMessagesMergedBySender,
  sortedCurrentChannelMessages,
  publicChannelsSelectors,
} from './publicChannels.selectors'
import { publicChannelsActions } from './publicChannels.slice'

import { formatMessageDisplayDate } from '../../utils/functions/dates/formatMessageDisplayDate'
import { displayableMessage } from '../../utils/functions/dates/formatDisplayableMessage'
import { DateTime } from 'luxon'
import { generateChannelId } from '@quiet/common'
import {
  type ChannelMessage,
  type Community,
  type DisplayableMessage,
  type Identity,
  MessageType,
  type PublicChannel,
  UserProfile,
} from '@quiet/types'
import { getBaseTypesFactory, getReduxStoreFactory } from '../../utils/tests/factories'
import { communitiesSelectors } from '../communities/communities.selectors'

describe('publicChannelsSelectors', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity
  let alice: UserProfile
  let john: UserProfile

  let generalChannel: PublicChannel
  let channelIdes: string[] = []

  const msgs: Record<string, ChannelMessage> = {}
  const msgsOwners: Record<string, string> = {}

  beforeAll(async () => {
    setupCrypto()

    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    owner = await factory.create('Identity')
    community =
      communitiesSelectors.currentCommunity(store.getState()) ||
      (await factory.create('Community', { id: owner.communityId }))

    alice = await factory.create('UserProfile', {
      userId: 'userId_alice',
      nickname: 'alice',
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState

    expect(generalChannel).not.toBeUndefined()

    channelIdes = [...channelIdes, generalChannel.id]
    john = await factory.create('UserProfile', {
      userId: 'userId_john',
      nickname: 'john',
    })

    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
    // Setup channels
    const channelNames = ['croatia', 'allergies', 'sailing', 'pets', 'antiques']

    for (const name of channelNames) {
      const channel = await factory.create('PublicChannel', {
        channel: {
          name,
          description: `Welcome to #${name}`,
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateChannelId(name),
        },
      })
      channelIdes = [...channelIdes, channel.channel.id]
    }

    const messageData = [
      {
        id: '1',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 5,
          minute: 50,
        }).toSeconds(),
        userId: alice.userId,
      },
      // Message 2 and 3 have info type, so they are tested for not being grouped together.
      {
        id: '2',
        type: 3,
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 10,
        }).toSeconds(),
        userId: alice.userId,
      },
      {
        id: '3',
        type: 3,
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 11,
          second: 30,
          millisecond: 1,
        }).toSeconds(),
        userId: alice.userId,
      },
      {
        id: '4',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 11,
          second: 30,
          millisecond: 2,
        }).toSeconds(),
        userId: alice.userId,
      },
      {
        id: '5',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 1,
        }).toSeconds(),
        userId: john.userId,
      },
      {
        id: '6',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 2,
        }).toSeconds(),
        userId: alice.userId,
      },
      {
        id: '7',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 18,
          minute: 2,
        }).toSeconds(),
        userId: alice.userId,
      },
      {
        id: '8',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 20,
          minute: 50,
        }).toSeconds(),
        userId: alice.userId,
      },
      {
        id: '9',
        createdAt: DateTime.fromObject({
          year: DateTime.now().toUTC().year,
          month: DateTime.now().toUTC().month,
          day: DateTime.now().toUTC().day,
          hour: 20,
          minute: 50,
        }).toSeconds(),
        userId: alice.userId,
      },
    ]

    // Shuffle messages array
    const shuffled = messageData
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)

    for (const item of shuffled) {
      const message = await factory.create('TestMessage', {
        message: {
          id: item.id,
          type: item.type || MessageType.Basic,
          message: `message_${item.id}`,
          createdAt: item.createdAt,
          channelId: generalChannel.id,
          userId: item.userId,
        },
        verifyAutomatically: true,
      })
      msgs[item.id] = message.message
      msgsOwners[item.id] = item.userId
    }
  })

  it('get messages sorted by date', async () => {
    const messages = sortedCurrentChannelMessages(store.getState())

    const formattedMessages = messages.reduce((prev: ChannelMessage[], curr: ChannelMessage) => {
      return [
        ...prev,
        {
          ...curr,
          channelId: 'general_ec4bca1fa76046c53dff1e49979c3647',
        },
      ]
    }, [])

    formattedMessages.forEach(message => {
      expect(message).toMatchSnapshot({
        createdAt: expect.any(Number),
        userId: expect.any(String),
      })
    })
  })

  it('get grouped messages', async () => {
    const messages = currentChannelMessagesMergedBySender(store.getState())
    // Convert regular messages to displayable messages
    const displayable: Record<string, DisplayableMessage> = {}
    for (const message of Object.values(msgs)) {
      // select user
      const user = message.userId === alice.userId ? alice : john
      displayable[message.id] = displayableMessage(message, user)
    }

    // Get groups names
    const groupDay1 = formatMessageDisplayDate(msgs['7'].createdAt)
    expect(groupDay1).toBe('Feb 5, 2021')
    const groupDay2 = formatMessageDisplayDate(msgs['1'].createdAt)
    expect(groupDay2).toBe('Oct 20, 2020')

    // Mock current date for "Today" test
    jest.spyOn(DateTime, 'now').mockImplementation(() =>
      DateTime.fromObject({
        year: DateTime.fromSeconds(msgs['9'].createdAt).year,
        month: DateTime.fromSeconds(msgs['9'].createdAt).month,
        day: DateTime.fromSeconds(msgs['9'].createdAt).day,
        hour: 12,
      })
    )
    const groupDay3 = formatMessageDisplayDate(msgs['9'].createdAt)
    expect(groupDay3).toBe('Today')

    const expectedGrouppedMessages = {
      [groupDay1]: [[displayable['7']], [displayable['8']]],
      [groupDay2]: [
        [displayable['1']],
        [displayable['2']],
        [displayable['3']],
        [displayable['4']],
        [displayable['5']],
        [displayable['6']],
      ],
      [groupDay3]: [[displayable['9']]],
    }
    expect(messages).toStrictEqual(expectedGrouppedMessages)
  })

  it('get channel list in a consistent order', async () => {
    const channels = getPublicChannels(store.getState()).map(channel => channel.name)

    expect(channels).toStrictEqual(['general', 'allergies', 'antiques', 'croatia', 'pets', 'sailing'])
  })

  it('unreadChannels return empty object if PublicChannels is in the wrong state (no channelStatus)', async () => {
    // This case occurred in a built app
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)
    await factory.create('Community')

    const oldState = store.getState()
    const channelId = oldState.PublicChannels.channels.ids[0]
    const newState = {
      ...oldState,
      PublicChannels: {
        ...oldState.PublicChannels,
        channels: {
          ids: oldState.PublicChannels.channels.ids,
          entities: {
            [channelId]: {
              ...oldState.PublicChannels.channels.entities[channelId],
              channelsStatus: undefined,
            },
          },
        },
      },
    }
    // @ts-expect-error
    const unreadChannels = publicChannelsSelectors.unreadChannels(newState)
    expect(unreadChannels).toEqual([])
  })

  it('unreadChannels selector returns only unread channels', async () => {
    const channelId = channelIdes.find(channelId => channelId.includes('allergies'))
    if (!channelId) throw new Error('no channel id')
    store.dispatch(
      publicChannelsActions.markUnreadChannel({
        channelId,
      })
    )
    const unreadChannels = publicChannelsSelectors.unreadChannels(store.getState())
    expect(unreadChannels).toEqual([channelId])
  })
})

export {}
