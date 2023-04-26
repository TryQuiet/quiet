import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory, MessageType, PublicChannel, WriteMessagePayload } from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from './../publicChannels.slice'
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { deletedChannelSaga } from './deletedChannel.saga'
import { messagesActions } from '../../messages/messages.slice'

describe('deletedChannelSaga', () => {
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

    generalChannel = publicChannelsSelectors.currentChannel(store.getState())

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
      const message = `@${owner.nickname} deleted #${channelAddress}`
      const messagePayload: WriteMessagePayload = {
        type: MessageType.Info,
        message,
        channelAddress: 'general'
      }
      const reducer = combineReducers(reducers)
      await expectSaga(
        deletedChannelSaga,
        publicChannelsActions.deletedChannel({
          channel: channelAddress
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.setCurrentChannel({ channelAddress: 'general' }))
        .put(publicChannelsActions.clearMessagesCache({ channelAddress }))
        .put(messagesActions.deleteChannelEntry({ channelAddress }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))
        .put(messagesActions.sendMessage(messagePayload))
        .run()
    })

    test('delete general channel', async () => {
      const channelAddress = 'general'
      const message = `#${channelAddress} has been recreated by @${owner.nickname}`
      const messagePayload: WriteMessagePayload = {
        type: MessageType.Info,
        message,
        channelAddress: 'general'
      }

      const reducer = combineReducers(reducers)
      await expectSaga(
        deletedChannelSaga,
        publicChannelsActions.deletedChannel({
          channel: channelAddress
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelAddress }))
        .put(messagesActions.deleteChannelEntry({ channelAddress }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))
        .put(publicChannelsActions.createGeneralChannel())
        .provide({
          call: (effect, next) => {}
        })
        .put(publicChannelsActions.finishGeneralRecreation())
        .put(messagesActions.sendMessage(messagePayload))
        .run()
    })
  })

  describe('handle saga logic as standard user', () => {
    beforeAll(async () => {
      store.dispatch(communitiesActions.updateCommunityData({ ...community, CA: '' }))
    })
    test('delete standard channel', async () => {
      const channelAddress = photoChannel.address
      const reducer = combineReducers(reducers)
      await expectSaga(
        deletedChannelSaga,
        publicChannelsActions.deletedChannel({
          channel: channelAddress
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.setCurrentChannel({ channelAddress: 'general' }))
        .put(publicChannelsActions.clearMessagesCache({ channelAddress }))
        .put(messagesActions.deleteChannelEntry({ channelAddress }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelAddress }))
        .run()
    })

    test('delete general channel', async () => {
      const channelAddress = 'general'

      const reducer = combineReducers(reducers)
      await expectSaga(
        deletedChannelSaga,
        publicChannelsActions.deletedChannel({
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
        .put(publicChannelsActions.finishGeneralRecreation())
        .run()
    })
  })
})
