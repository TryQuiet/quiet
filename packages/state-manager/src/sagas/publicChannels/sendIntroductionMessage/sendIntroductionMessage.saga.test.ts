import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from '@reduxjs/toolkit'

import { setupCrypto } from '@quiet/identity'
import { capitalizeFirstLetter, userJoinedMessage } from '@quiet/common'

import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../..'
import { reducers } from '../../reducers'
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

    store.dispatch(communitiesActions.updateCommunityData({ ...community, CA: null }))

    const user = await factory.create('Identity', {
      communityId: community.id,
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
      .call(userJoinedMessage, user.nickname)
      .put(
        messagesActions.sendMessage({
          type: MessageType.Info,
          message: userJoinedMessage(user.nickname),
          channelId: generalChannel?.id,
        })
      )
      .put(identityActions.updateIdentity({ ...user, introMessageSent: true }))
      .run()
  })
})
