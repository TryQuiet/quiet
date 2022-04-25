import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { updateMessagesSendingStatusSaga } from './updateMessagesSendingStatus.saga'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { ChannelMessage } from '../../publicChannels/publicChannels.types'
import { messagesActions } from '../messages.slice'

describe('updateMessagesSendingStatusSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let message: ChannelMessage

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    message = (await factory.build<typeof publicChannelsActions.test_message>(
      'Message',
      { identity: alice }
    )).payload.message
  })

  test('remove pending message status', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      updateMessagesSendingStatusSaga,
      publicChannelsActions.cacheMessages({
        messages: [message],
        channelAddress: 'general',
        communityId: community.id
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(messagesActions.removePendingMessageStatus(message.id))
      .run()
  })
})
