import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { channelDeletionResponseSaga } from './channelDeletionResponse.saga'
import { generateChannelId } from '@quiet/common'
import { CommunityOwnership, type Community, type Identity, type Channel } from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { select } from 'redux-saga-test-plan/matchers'

const provideDelay = ({ fn }: any, next: () => any) => (fn.name === 'delayP' ? null : next())

describe('channelDeletionResponseSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let photoChannel: Channel
  let generalChannel: Channel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    owner = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    photoChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('Channel', {
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
          id: generateChannelId('photo'),
        },
      })
    ).channel
  })

  describe('handle saga logic as owner of community', () => {
    test('delete standard channel', async () => {
      const channelId = photoChannel.id

      const reducer = combineReducers(testReducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
          deleted: true,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .put(publicChannelsActions.completeChannelDeletion({}))
        .put(messagesActions.sendDeletionMessage({ channelId }))
        .run()
    })

    test('delete general channel', async () => {
      const channelId = generalChannel.id

      const reducer = combineReducers(testReducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
          deleted: true,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .put(publicChannelsActions.completeChannelDeletion({}))
        .put(publicChannelsActions.createGeneralChannel())

        .run()
    })

    test('delete channel which not exist in store', async () => {
      const channelId = 'random channel'

      const reducer = combineReducers(testReducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
          deleted: false,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .not.put(publicChannelsActions.clearMessagesCache({ channelId }))
        .not.put(messagesActions.deleteChannelEntry({ channelId }))
        .not.put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .not.put(publicChannelsActions.completeChannelDeletion({}))
        .not.put(messagesActions.sendDeletionMessage({ channelId }))
        .run()
    })
  })

  describe('handle saga logic as standard user', () => {
    beforeAll(async () => {
      store.dispatch(communitiesActions.updateCommunityData({ ...community, ownership: CommunityOwnership.User }))
    })
    test('delete standard channel', async () => {
      const channelId = photoChannel.id
      const reducer = combineReducers(testReducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
          deleted: true,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .put(publicChannelsActions.completeChannelDeletion({}))
        .run()
    })

    test('delete general channel while user is on general channel', async () => {
      store.dispatch(
        publicChannelsActions.setCurrentChannel({
          channelId: generalChannel.id,
        })
      )
      const channelId = generalChannel.id
      const newGeneralId = 'newGeneralId'

      const newGeneralChannel: Channel = {
        name: 'general',
        description: 'general_description',
        owner: 'general_owner',
        timestamp: 0,
        id: newGeneralId,
        public: true,
      }

      const reducer = combineReducers(testReducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
          deleted: true,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .put(publicChannelsActions.completeChannelDeletion({}))
        .provide([{ call: provideDelay }, [select(publicChannelsSelectors.generalChannel), generalChannel]])
        .put(publicChannelsActions.setCurrentChannel({ channelId }))
        .run()
    })

    test('delete general channel while user in on other channel', async () => {
      store.dispatch(
        publicChannelsActions.setCurrentChannel({
          channelId: photoChannel.id,
        })
      )
      const channelId = generalChannel.id

      const reducer = combineReducers(testReducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
          deleted: true,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .put(publicChannelsActions.completeChannelDeletion({}))
        .run()
    })

    test('delete channel which not exist in store', async () => {
      const channelId = 'random channel'

      const reducer = combineReducers(testReducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
          deleted: false,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())
        .not.put(publicChannelsActions.clearMessagesCache({ channelId }))
        .not.put(messagesActions.deleteChannelEntry({ channelId }))
        .not.put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .not.put(publicChannelsActions.completeChannelDeletion({}))
        .not.put(messagesActions.sendDeletionMessage({ channelId }))
        .run()
    })
  })
})
