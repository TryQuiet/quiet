import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { type identityActions } from '../../identity/identity.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import { channelDeletionResponseSaga } from './channelDeletionResponse.saga'
import { generateChannelId } from '@quiet/common'
import { type Community, type Identity, type PublicChannel } from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { select } from 'redux-saga-test-plan/matchers'

const provideDelay = ({ fn }: any, next: () => any) => (fn.name === 'delayP' ? null : next())

describe('channelDeletionResponseSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let photoChannel: PublicChannel
  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    owner = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    photoChannel = (
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
  describe('handle saga logic as owner of community', () => {
    test('delete standard channel', async () => {
      const channelId = photoChannel.id

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
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

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
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

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
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
      store.dispatch(communitiesActions.updateCommunityData({ ...community, CA: null }))
    })
    test('delete standard channel', async () => {
      const channelId = photoChannel.id
      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
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

      const newGeneralChannel: PublicChannel = {
        name: 'general',
        description: 'general_description',
        owner: 'general_owner',
        timestamp: 0,
        id: newGeneralId,
      }

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
        })
      )
        .withReducer(reducer)
        .withState(store.getState())

        .put(publicChannelsActions.startGeneralRecreation())
        .put(publicChannelsActions.clearMessagesCache({ channelId }))
        .put(messagesActions.deleteChannelEntry({ channelId }))
        .put(publicChannelsActions.deleteChannelFromStore({ channelId }))
        .put(publicChannelsActions.completeChannelDeletion({}))
        // .dispatch(publicChannelsActions.createGeneralChannel())
        // .dispatch(
        //   publicChannelsActions.addChannel({
        //     channel: newGeneralChannel
        //   })
        // )
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

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
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

      const reducer = combineReducers(reducers)
      await expectSaga(
        channelDeletionResponseSaga,
        publicChannelsActions.channelDeletionResponse({
          channelId,
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
