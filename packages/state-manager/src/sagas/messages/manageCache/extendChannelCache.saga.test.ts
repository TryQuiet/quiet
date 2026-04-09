import { setupCrypto } from '@quiet/identity'
import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { getReduxStoreFactory } from '../../../utils/tests/factories'
import { prepareStore, testReducers } from '../../..//utils/tests/prepareStore'
import { combineReducers, type Store } from 'redux'
import { type communitiesActions } from '../../communities/communities.slice'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { publicChannelsSelectors, selectGeneralChannel } from '../../publicChannels/publicChannels.selectors'
import { DateTime } from 'luxon'
import { messagesActions } from '../messages.slice'
import { extendCurrentPublicChannelCacheSaga } from './extendChannelCache.saga'
import { messagesSelectors } from '../messages.selectors'
import { type ChannelMessage, type Community, type Identity, MessageType, type PublicChannel } from '@quiet/types'

describe('extendCurrentPublicChannelCacheSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
  })

  test('extend current public channel cache', async () => {
    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    // Populate cache with messages
    const iterations = 120
    const messages: ChannelMessage[] = []
    await new Promise(resolve => {
      ;[...Array(iterations)].map(async (_, index) => {
        const item = (
          await factory.create('TestMessage', {
            message: {
              id: Math.random().toString(36).substr(2.9),
              type: MessageType.Basic,
              message: 'message',
              createdAt: DateTime.utc().valueOf() + DateTime.utc().minus({ minutes: index }).valueOf(),
              channelId: generalChannel.id,
              userId: alice.userId,
            },
            verifyAutomatically: true,
          })
        ).message
        messages.push(item)
        if (messages.length === iterations) {
          resolve(true)
        }
      })
    })

    await factory.create('CacheMessages', {
      messages: messages.slice(0, 50),
      channelId: generalChannel.id,
    })

    // Confirm cache is full (contains maximum number of messages to display)
    const sortedCurrentChannelMessages = publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())
    expect(sortedCurrentChannelMessages.length).toBe(50)

    // Prepare data for assertion
    const messagesEntries = messagesSelectors.sortedCurrentPublicChannelMessagesEntries(store.getState())
    expect(messagesEntries.length).toBe(iterations)
    const updatedCache = messagesEntries.slice(messagesEntries.length - 100, messagesEntries.length)

    const reducer = combineReducers(testReducers)
    await expectSaga(extendCurrentPublicChannelCacheSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: updatedCache,
          channelId: generalChannel.id,
        })
      )
      .put(
        messagesActions.setDisplayedMessagesNumber({
          channelId: generalChannel.id,
          display: 100,
        })
      )
      .run()
  })
})
