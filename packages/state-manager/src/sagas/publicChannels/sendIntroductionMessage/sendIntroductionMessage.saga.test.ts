import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from '@reduxjs/toolkit'

import { setupCrypto } from '@quiet/identity'
import { userJoinedMessage } from '@quiet/common'

import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../..'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from './../publicChannels.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { messagesActions } from '../../messages/messages.slice'
import { sendIntroductionMessageSaga } from './sendIntroductionMessage.saga'
import { CommunityOwnership, MessageType } from '@quiet/types'

describe('sendIntroductionMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
  })

  test('sends introduction message', async () => {
    const community = await factory.create('Community', { ownership: CommunityOwnership.User })

    store.dispatch(communitiesActions.updateCommunityData({ id: community.id, updates: { CA: null } }))

    const identity = await factory.create('Identity', {
      communityId: community.id,
      userId: 'userId',
    })
    const userProfile = await factory.create('UserProfile', {
      userId: identity.userId,
    })

    await factory.create('PublicChannel')

    const generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    const reducer = combineReducers(testReducers)

    await expectSaga(
      sendIntroductionMessageSaga,
      // @ts-ignore
      publicChannelsActions.sendIntroductionMessage()
    )
      .withReducer(reducer)
      .withState(store.getState())
      .call(userJoinedMessage, userProfile.nickname)
      .put(
        messagesActions.sendMessage({
          type: MessageType.Info,
          message: userJoinedMessage(userProfile.nickname),
          channelId: generalChannel?.id,
        })
      )
      .put(identityActions.updateIdentity({ ...identity, introMessageSent: true }))
      .run()
  })
})
