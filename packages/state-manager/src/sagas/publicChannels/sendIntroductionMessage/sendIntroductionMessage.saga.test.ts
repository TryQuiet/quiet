import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from '@reduxjs/toolkit'

import { setupCrypto } from '@quiet/identity'
import { capitalizeFirstLetter } from '@quiet/common'

import { type Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../..'
import { reducers } from '../../reducers'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from './../publicChannels.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { messagesActions } from '../../messages/messages.slice'
import { sendIntroductionMessageSaga } from './sendIntroductionMessage.saga'

describe('sendIntroductionMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('sends introduction message', async () => {
    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    store.dispatch(communitiesActions.updateCommunityData({ ...community, CA: null }))

    const user = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
    })

    await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel')

    const generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    const reducer = combineReducers(reducers)

    await expectSaga(
      sendIntroductionMessageSaga,
      // @ts-ignore
      publicChannelsActions.sendIntroductionMessage()
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: `**@${user.nickname}** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ#how-does-username-registration-work)`,
          channelId: generalChannel?.id,
        })
      )
      .put(identityActions.updateIdentity({ ...user, introMessageSent: true }))
      .run()
  })
})
