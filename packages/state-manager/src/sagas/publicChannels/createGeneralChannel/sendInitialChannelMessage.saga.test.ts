import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getReduxStoreFactory } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { sendInitialChannelMessageSaga } from './sendInitialChannelMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { combineReducers } from '@reduxjs/toolkit'
import { generalChannelDeletionMessage, generateChannelId } from '@quiet/common'
import { type Community, type PublicChannel, type Identity, UserProfile } from '@quiet/types'
import { userProfiles, userProfileSelectors } from '../../users/userProfile/userProfile.selectors'

describe('sendInitialChannelMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let channel: PublicChannel

  let generalChannel: PublicChannel

  let community: Community
  let owner: Identity
  let ownerUserProfile: UserProfile

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    owner = await factory.create('Identity', {
      communityId: community.id,
      userId: 'ownerUserId',
    })
    ownerUserProfile = await factory.create('UserProfile', {
      userId: owner.userId,
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    channel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
          id: generateChannelId('photo'),
        },
      })
    ).channel!
  })

  test('send initial channel message', async () => {
    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendInitialChannelMessageSaga,
      publicChannelsActions.sendInitialChannelMessage({
        channelName: channel.name,
        channelId: channel.id,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: `Created #${channel.name}`,
          channelId: channel.id,
        })
      )
      .run()
  })

  test('send deletion message for general channel', async () => {
    store.dispatch(publicChannelsActions.startGeneralRecreation())
    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendInitialChannelMessageSaga,
      publicChannelsActions.sendInitialChannelMessage({
        channelName: generalChannel.name,
        channelId: generalChannel.id,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: generalChannelDeletionMessage(ownerUserProfile.nickname),
          channelId: generalChannel.id,
        })
      )
      .run()
  })
})
