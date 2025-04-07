import { type Store } from '../store.types'
import { getReduxStoreFactory } from '../..'
import { prepareStore } from '../../utils/tests/prepareStore'
import { type communitiesActions } from '../communities/communities.slice'
import { type FactoryGirl } from 'factory-girl'
import { publicChannelsSelectors } from '../publicChannels/publicChannels.selectors'
import {
  ChannelMessage,
  MessageSendingStatus,
  MessageVerificationStatus,
  SendingStatus,
  type Community,
  type Identity,
  type PublicChannel,
} from '@quiet/types'
import { getBaseTypesFactory } from '../../utils/tests/factories'
import { messagesSelectors } from './messages.selectors'
import { createLogger } from '../../utils/logger'

const logger = createLogger('messagesSelectors-test')

describe('messagesSelectors', () => {
  let store: Store
  let factory: FactoryGirl
  let baseTypesFactory: FactoryGirl

  let community: Community
  let generalChannel: PublicChannel
  let generalChannelId: string

  let alice: Identity
  let john: Identity

  let messages: ChannelMessage[]
  const messageSendingStatuses: Record<string, MessageSendingStatus> = {}
  const messageVerificationStatuses: Record<string, MessageVerificationStatus> = {}

  beforeAll(async () => {
    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)
    baseTypesFactory = await getBaseTypesFactory()

    community = await factory.create('Community')

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
    expect(generalChannel).toBeDefined()
    generalChannelId = generalChannel?.id || ''

    alice = await factory.create('Identity', {
      communityId: community.id,
    })

    john = await factory.create('Identity', {
      communityId: community.id,
    })

    const numberOfMessages = 4
    messages = await baseTypesFactory.buildMany('ChannelMessage', numberOfMessages)
    messages = messages.map(message => ({
      ...message,
      channelId: generalChannelId,
    }))

    const statuses = [SendingStatus.Sent, SendingStatus.Pending, SendingStatus.Sent, SendingStatus.Pending]
    const verifications = [true, false, true, false]
    await factory.create('AddMessages', {
      messages: messages,
    })
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      const isVerified = verifications[i]
      const status = statuses[i]
      messageVerificationStatuses[messages[i].id] = {
        id: messages[i].id,
        isVerified: verifications[i],
      }
      messageSendingStatuses[messages[i].id] = {
        id: messages[i].id,
        status: statuses[i],
      }
      await factory.create('MessageVerificationStatus', { message, isVerified })
      await factory.create('MessageSendingStatus', { message, status })
    }
  })

  it('should select MessageVerificationStatus', () => {
    const messageVerificationStatus = messagesSelectors.messagesVerificationStatus(store.getState())
    expect(messageVerificationStatus).toEqual(messageVerificationStatuses)
  })

  it('should select MessageSendingStatus', () => {
    const messageSendingStatus = messagesSelectors.messagesSendingStatus(store.getState())
    expect(messageSendingStatus).toEqual(messageSendingStatuses)
  })

  it('should select publicChannelsMessagesBase', () => {
    const publicChannelsMessagesBase = messagesSelectors.publicChannelsMessagesBase(store.getState())
    expect(publicChannelsMessagesBase).toBeDefined()
    expect(publicChannelsMessagesBase[generalChannelId]).toBeDefined()
    expect(publicChannelsMessagesBase[generalChannelId]?.messages).toBeDefined()
  })

  it('should select currentPublicChannelMessagesBase', () => {
    const result = messagesSelectors.currentPublicChannelMessagesBase(store.getState())
    expect(result?.channelId).toEqual(generalChannelId)
  })

  it('should select currentPublicChannelMessagesEntities', () => {
    const result = messagesSelectors.currentPublicChannelMessagesEntities(store.getState())
    const messageIds = messages.map(m => m.id)
    expect(Object.keys(result)).toEqual(expect.arrayContaining(messageIds))
  })

  it('should select currentPublicChannelMessagesEntries', () => {
    const result = messagesSelectors.currentPublicChannelMessagesEntries(store.getState())
    const sortedMessages = [...messages].sort((a, b) => b.createdAt - a.createdAt).reverse()
    expect(result.map(m => m.id)).toEqual(sortedMessages.map(m => m.id))
  })

  it('should select validCurrentPublicChannelMessagesEntries', () => {
    const result = messagesSelectors.validCurrentPublicChannelMessagesEntries(store.getState())
    const expected = messages.filter(m => messageVerificationStatuses[m.id]?.isVerified)
    expect(result.length).toEqual(expected.length)
  })
})
