import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, Identity } from '../../..'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { PublicChannel } from '../publicChannels.types'
import { sendInitialChannelMessageSaga } from './sendInitialChannelMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { DateTime } from 'luxon'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../reducers'

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

    community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    owner = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    generalChannel = publicChannelsSelectors.currentChannel(store.getState())

    channel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: 'photo',
            description: 'Welcome to #photo',
            timestamp: DateTime.utc().valueOf(),
            owner: owner.nickname,
            address: 'photo'
          }
        }
      )
    ).channel
  })

  test('send initial channel message', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      sendInitialChannelMessageSaga,
      publicChannelsActions.sendInitialChannelMessage({
        channelName: channel.name,
        channelAddress: channel.address
      })
    )
    .withReducer(reducer)
    .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          type: 3,
          message: `Created #${channel.name}`,
          channelAddress: channel.address
        })
      )
      .run()
  })
})
