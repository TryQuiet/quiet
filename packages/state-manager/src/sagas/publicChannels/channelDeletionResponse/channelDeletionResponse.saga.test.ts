import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { channelDeletionResponseSaga } from './channelDeletionResponse.saga'
import { Community, Identity, PublicChannel } from '@quiet/types'

describe('channelDeletionResponseSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let photoChannel: PublicChannel

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

    photoChannel = (
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
  describe('handle saga logic as owner of community', () => {
    test('delete standard channel', async () => {
      const channelAddress = photoChannel.address

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channel: channelAddress
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .put(publicChannelsActions.clearMessagesCache({ channelAddress }))
        .put(messagesActions.deleteChannelEntry({ channelAddress }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))
        .put(messagesActions.sendDeletionMessage({ channelAddress }))
        .run()
    })

    test('delete general channel', async () => {
      const channelAddress = 'general'

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channel: channelAddress
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelAddress }))
        .put(messagesActions.deleteChannelEntry({ channelAddress }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))
        .provide({
          call: (effect, next) => {}
        })
        .put(publicChannelsActions.createGeneralChannel())

        .run()
    })
  })

  describe('handle saga logic as standard user', () => {
    beforeAll(async () => {
      store.dispatch(communitiesActions.updateCommunityData({ ...community, CA: null }))
    })
    test('delete standard channel', async () => {
      const channelAddress = photoChannel.address
      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channel: channelAddress
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .put(publicChannelsActions.clearMessagesCache({ channelAddress }))
        .put(messagesActions.deleteChannelEntry({ channelAddress }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))
        .run()
    })

    test('delete general channel', async () => {
      const channelAddress = 'general'

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channel: channelAddress
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelAddress }))
        .put(messagesActions.deleteChannelEntry({ channelAddress }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))
        .run()
    })
  })
})
