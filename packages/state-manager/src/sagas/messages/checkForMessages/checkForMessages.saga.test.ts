import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { generateMessageFactoryContentWithId, getReduxStoreFactory, type publicChannels } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { messagesActions } from './../messages.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { checkForMessagesSaga } from './checkForMessages.saga'
import { selectGeneralChannel } from '../../publicChannels/publicChannels.selectors'
import { type Community, type Identity, type PublicChannel } from '@quiet/types'
import { getBaseTypesFactory } from 'packages/state-manager/src/utils/tests/factories'
import { channel } from 'redux-saga'

describe('checkForMessagesSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let baseTypes: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)
    baseTypes = await getBaseTypesFactory()

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    generalChannel = {
      ...selectGeneralChannel(store.getState()),
      // @ts-ignore
      messages: undefined,
      messagesSlice: undefined,
    }

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
  })

  test('ask for missing messages', async () => {
    const message = (
      await factory.create('TestMessage', {
        message: baseTypes.build('ChannelMessage', { channelId: generalChannel.id, userId: alice.userId }),
        verifyAutomatically: true,
      })
    ).message

    const reducer = combineReducers(testReducers)
    await expectSaga(
      checkForMessagesSaga,
      messagesActions.checkForMessages({
        ids: [message.id, 'jf84hwwa', 'kl12sa0a'],
        channelId: generalChannel.id,
        communityId: community.id,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.getMessages({
          peerId: alice.networkInfo.peerId.id,
          communityId: community.id,
          channelId: generalChannel.id,
          ids: ['jf84hwwa', 'kl12sa0a'],
        })
      )
      .run()
  })
})
