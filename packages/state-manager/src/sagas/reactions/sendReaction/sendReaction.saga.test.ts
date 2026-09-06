import { setupCrypto } from '@quiet/identity'
import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from 'redux'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../../utils/tests/factories'
import { sendReactionSaga } from './sendReaction.saga'
import { reactionsActions } from '../reactions.slice'
import { messagesActions } from '../../messages/messages.slice'
import { MessageType } from '@quiet/types'
import { type Store } from 'redux'
import { type Community, type Identity } from '@quiet/types'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { type PublicChannel } from '@quiet/types'

describe('sendReactionSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let community: Community
  let alice: Identity
  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')
    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
  })

  test('dispatches sendMessage with reaction payload on add', async () => {
    const targetMessageId = 'target-msg-123'
    const emoji = '👍'

    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendReactionSaga,
      {} as any, // socket not needed — sendReactionSaga only dispatches to messagesActions
      reactionsActions.sendReaction({
        targetMessageId,
        emoji,
        channelId: generalChannel.id,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          message: JSON.stringify({ targetMessageId, emoji, action: 'add' }),
          type: MessageType.Reaction,
          channelId: generalChannel.id,
        })
      )
      .run()
  })

  test('dispatches sendMessage with remove action when already reacted', async () => {
    const targetMessageId = 'target-msg-456'
    const emoji = '😄'

    // Pre-populate store with an existing 'add' reaction entry
    store.dispatch(
      reactionsActions.addReactionEntries([
        {
          id: 'existing-reaction-id',
          targetMessageId,
          emoji,
          action: 'add',
          userId: alice.userId,
          createdAt: Date.now() - 1000,
        },
      ])
    )

    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendReactionSaga,
      {} as any,
      reactionsActions.sendReaction({
        targetMessageId,
        emoji,
        channelId: generalChannel.id,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          message: JSON.stringify({ targetMessageId, emoji, action: 'remove' }),
          type: MessageType.Reaction,
          channelId: generalChannel.id,
        })
      )
      .run()
  })
})
