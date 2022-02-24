import { keyFromCertificate, parseCertificate, setupCrypto } from '@quiet/identity'
import { Store } from '../store.types'
import { getFactory, Identity, publicChannels } from '../..'
import { prepareStore } from '../../utils/tests/prepareStore'
import {
  currentChannelMessagesCount,
  currentChannelMessagesMergedBySender,
  slicedCurrentChannelMessages,
  sortedCurrentChannelMessages,
  validCurrentChannelMessages
} from './publicChannels.selectors'
import { publicChannelsActions } from './publicChannels.slice'
import { DisplayableMessage } from './publicChannels.types'
import { communitiesActions, Community } from '../communities/communities.slice'
import { identityActions } from '../identity/identity.slice'
import { DateTime } from 'luxon'
import { MessageType } from '../messages/messages.types'
import { currentCommunityId } from '../communities/communities.selectors'
import { FactoryGirl } from 'factory-girl'
import { ChannelMessage } from './publicChannels.types'
import { formatMessageDisplayDate, formatMessageDisplayDay } from '../../utils/functions/dates/formatMessageDisplayDate'
import { displayableMessage } from '../../utils/functions/dates/formatDisplayableMessage'

describe('publicChannelsSelectors', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let john: Identity

  let msgs: { [id: string]: ChannelMessage } = {}
  let msgsOwners: { [id: string]: string } = {}

  beforeAll(async () => {
    setupCrypto()

    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    john = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'john' }
    )

    /* Messages ids are being used only for veryfing proper order...
    ...they have no impact on selectors work */
    const messages = [
      {
        id: '1',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 5,
          minute: 50
        }).toSeconds(),
        identity: alice
      },
      {
        id: '2',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 10
        }).toSeconds(),
        identity: alice
      },
      {
        id: '3',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 11,
          second: 30,
          millisecond: 1
        }).toSeconds(),
        identity: alice
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
          millisecond: 2
        }).toSeconds(),
        identity: alice
      },
      {
        id: '5',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 1
        }).toSeconds(),
        identity: john
      },
      {
        id: '6',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 2
        }).toSeconds(),
        identity: alice
      },
      {
        id: '7',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 18,
          minute: 2
        }).toSeconds(),
        identity: alice
      },
      {
        id: '8',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 20,
          minute: 50
        }).toSeconds(),
        identity: alice
      },
      {
        id: '9',
        createdAt: DateTime.fromObject({
          year: DateTime.now().toUTC().year,
          month: DateTime.now().toUTC().month,
          day: DateTime.now().toUTC().day,
          hour: 20,
          minute: 50
        }).toSeconds(),
        identity: alice
      }
    ]

    // Shuffle messages array
    const shuffled = messages
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)

    
    for (const item of shuffled) {
      const message = await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>(
        'Message',
        {
          identity: item.identity,
          message: {
            id: item.id,
            type: MessageType.Basic,
            message: `message_${item.id}`,
            createdAt: item.createdAt,
            channelAddress: 'general',
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        }
      )
      msgs[item.id] = message.message
      msgsOwners[item.id] = item.identity.nickname
    }
  })

  beforeEach(async () => {
    const community = currentCommunityId(store.getState())
    store.dispatch(
      publicChannels.actions.setChannelLoadingSlice({
        communityId: community,
        slice: 0
      })
    )
  })

  it('get messages sorted by date', async () => {
    const messages = sortedCurrentChannelMessages(store.getState())
    messages.forEach(message => {
      expect(message).toMatchSnapshot({
        createdAt: expect.any(Number),
        pubKey: expect.any(String),
        signature: expect.any(String)
      })
    })
  })

  it('get sliced messages count', async () => {
    const messagesCountBefore = currentChannelMessagesCount(store.getState())
    const community = currentCommunityId(store.getState())
    store.dispatch(
      publicChannels.actions.setChannelLoadingSlice({
        communityId: community,
        slice: 2
      })
    )
    const messagesCountAfter = currentChannelMessagesCount(store.getState())
    expect(messagesCountAfter).toBe(messagesCountBefore - 2)
  })

  it('get sliced messages', async () => {
    const expectedSlicedMessagesOrder = [
      msgs['3'],
      msgs['4'],
      msgs['5'],
      msgs['6'],
      msgs['7'],
      msgs['8'],
      msgs['9']
    ]
    const community = currentCommunityId(store.getState())
    store.dispatch(
      publicChannels.actions.setChannelLoadingSlice({
        communityId: community,
        slice: 2
      })
    )
    const messages = slicedCurrentChannelMessages(store.getState())
    expect(messages).toStrictEqual(expectedSlicedMessagesOrder)
  })

  it('get grouped messages', async () => {
    const messages = currentChannelMessagesMergedBySender(store.getState())
    
    // Convert regular messages to displayable messages
    const displayable: {[id: string]: DisplayableMessage} = {}
    for (const message of Object.values(msgs)) {
      displayable[message.id] = displayableMessage(message, msgsOwners[message.id])
    }
    
    // Get groups names
    const groupDay1 = formatMessageDisplayDay(formatMessageDisplayDate(msgs['7'].createdAt))
    expect(groupDay1).toBe('Feb 05')
    const groupDay2 = formatMessageDisplayDay(formatMessageDisplayDate(msgs['1'].createdAt))
    expect(groupDay2).toBe('Oct 20')
    const groupDay3 = formatMessageDisplayDay(formatMessageDisplayDate(msgs['9'].createdAt))
    expect(groupDay3).toBe('Today')

    const expectedGrouppedMessages = {
      [groupDay1]: [
        [displayable['7'], displayable['8']]
      ],
      [groupDay2]: [
        [displayable['1'], displayable['2'], displayable['3'], displayable['4']], 
        [displayable['5']], 
        [displayable['6']]
      ],
      [groupDay3]: [
        [displayable['9']]
      ],
    }
    expect(messages).toStrictEqual(expectedGrouppedMessages)
  })

  it('filter out unverified messages', async () => {
    const channel = (
      await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>(
        'PublicChannel',
        {
          communityId: community.id,
          channel: {
            name: 'spoofing',
            description: 'Welcome to channel #spoofing',
            timestamp: DateTime.utc().toSeconds(),
            owner: 'alice',
            address: 'spoofing'
          }
        }
      )
    ).channel

    const johnPublicKey = keyFromCertificate(parseCertificate(john.userCertificate))

    // Build messages
    const authenticMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelAddress: channel.address
    }

    const spoofedMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelAddress: channel.address,
      pubKey: johnPublicKey
    }

    // Store messages
    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      { identity: alice, message: authenticMessage, verifyAutomatically: true }
    )

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      { identity: alice, message: spoofedMessage, verifyAutomatically: true }
    )

    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelAddress: channel.address,
        communityId: community.id
      })
    )

    const messages = validCurrentChannelMessages(store.getState())

    expect(messages.length).toBe(1)

    expect(messages[0].id).toBe(authenticMessage.id)
  })
})

export {}
