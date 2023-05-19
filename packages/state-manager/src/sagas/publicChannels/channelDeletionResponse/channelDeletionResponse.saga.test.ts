import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory, MessageType, PublicChannel, WriteMessagePayload } from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { channelDeletionResponseSaga } from './channelDeletionResponse.saga'
import { generateChannelId } from '@quiet/common'

describe('channelDeletionResponseSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let generalChannel: PublicChannel
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

    generalChannel = publicChannelsSelectors.generalChannel(store.getState())

    photoChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: 'photo',
            description: 'Welcome to #photo',
            timestamp: DateTime.utc().valueOf(),
            owner: owner.nickname,
            id: generateChannelId('photo')
          }
        }
      )
    ).channel
  })
  describe('handle saga logic as owner of community', () => {
    test('delete standard channel', async () => {
      const channelId = photoChannel.id

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .put(messagesActions.sendDeletionMessage({ channelId }))
        .run()
    })

    test('delete general channel', async () => {
      const channelId = generalChannel.id

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .provide({
          call: (effect, next) => {}
        })
        .put(publicChannelsActions.createGeneralChannel())

        .run()
    })
  })

  describe('handle saga logic as standard user', () => {
    beforeAll(async () => {
      store.dispatch(communitiesActions.updateCommunityData({ ...community, CA: '' }))
    })
    test('delete standard channel', async () => {
      const channelId = photoChannel.id
      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .run()
    })

    test('delete general channel', async () => {
      const channelId = generalChannel.id

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .run()
    })
  })
})
