import { type Store } from '../store.types'
import { getReduxStoreFactory, publicChannels } from '../..'
import { prepareStore } from '../../utils/tests/prepareStore'
import { validCurrentPublicChannelMessagesEntries } from './messages.selectors'
import { type communitiesActions } from '../communities/communities.slice'
import { type FactoryGirl } from 'factory-girl'
import { publicChannelsSelectors } from '../publicChannels/publicChannels.selectors'
import { type Community, type Identity, type PublicChannel, type ChannelMessage } from '@quiet/types'
import { getBaseTypesFactory } from '../../utils/tests/factories'

describe('messagesSelectors', () => {
  let store: Store
  let factory: FactoryGirl
  let baseTypesFactory: FactoryGirl

  let community: Community
  let generalChannel: PublicChannel
  let generalChannelId: string

  let alice: Identity
  let john: Identity

  beforeEach(async () => {
    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)
    baseTypesFactory = await getBaseTypesFactory()

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
    expect(generalChannel).toBeDefined()
    generalChannelId = generalChannel?.id || ''

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })

    john = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'john',
    })
  })

  it('filter out unverified messages', async () => {
    expect(john.userId).not.toBeNull()

    // Build messages
    const authenticMessage: ChannelMessage = {
      ...(
        await factory.build('TestMessage', {
          identity: alice,
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelId: generalChannel.id,
    }

    const spoofedMessage: ChannelMessage = {
      ...(
        await factory.build('TestMessage', {
          identity: alice,
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      channelId: generalChannel.id,
    }

    // Store messages
    await factory.create('TestMessage', {
      identity: alice,
      message: authenticMessage,
      verifyAutomatically: true,
    })

    await factory.create('TestMessage', {
      identity: alice,
      message: spoofedMessage,
      verifyAutomatically: false,
    })

    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const messages = validCurrentPublicChannelMessagesEntries(store.getState())

    expect(messages.length).toBe(1)

    expect(messages[0].id).toBe(authenticMessage.id)
  })
})
