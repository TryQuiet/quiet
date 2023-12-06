import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory, type Identity } from '../../..'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { sendInitialChannelMessageSaga } from './sendInitialChannelMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { DateTime } from 'luxon'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../reducers'
import { generateChannelId } from '@quiet/common'
import { type Community, type PublicChannel } from '@quiet/types'

describe('sendInitialChannelMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let channel: PublicChannel

  let generalChannel: PublicChannel

  let community: Community
  let owner: Identity

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    owner = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
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
          owner: owner.nickname,
          id: generateChannelId('photo'),
        },
      })
    ).channel
  })

  test('send initial channel message', async () => {
    const reducer = combineReducers(reducers)
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
          message: `@${owner.nickname} created #${channel.name}`,
          channelId: channel.id,
        })
      )
      .run()
  })

  test('send deletion message for general channel', async () => {
    store.dispatch(publicChannelsActions.startGeneralRecreation())
    const reducer = combineReducers(reducers)
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
          message: `@${owner.nickname} deleted all messages in #general`,
          channelId: generalChannel.id,
        })
      )
      .run()
  })
})
