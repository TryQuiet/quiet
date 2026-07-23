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
import { generalChannelDeletionMessage, generateTestChannelId } from '@quiet/common'
import { type Community, type PublicChannel, type Identity, UserProfile, ChannelType } from '@quiet/types'

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
          id: generateTestChannelId('photo'),
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
        type: ChannelType.CHANNEL,
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
        type: ChannelType.CHANNEL,
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

  test('waits for matching general channel subscription before queueing the recreation message', async () => {
    const localStore = prepareStore().store
    const localFactory = await getReduxStoreFactory(localStore)
    const localCommunity = await localFactory.create('Community')
    const localOwner = await localFactory.create('Identity', {
      communityId: localCommunity.id,
      userId: 'localOwnerUserId',
    })
    const localOwnerUserProfile = await localFactory.create('UserProfile', {
      userId: localOwner.userId,
    })
    const localGeneralChannel = publicChannelsSelectors.generalChannel(localStore.getState())
    if (!localGeneralChannel) throw new Error('No general channel')
    localStore.dispatch(publicChannelsActions.startGeneralRecreation())
    const baseState = localStore.getState()
    const stateWithNoSubscriptions = {
      ...baseState,
      PublicChannels: {
        ...baseState.PublicChannels,
        channelsSubscriptions: {
          ids: [],
          entities: {},
        },
      },
    }
    const expectedMessagePayload = {
      type: 3,
      message: generalChannelDeletionMessage(localOwnerUserProfile.nickname),
      channelId: localGeneralChannel.id,
    }
    const reducer = combineReducers(testReducers)

    await expectSaga(
      sendInitialChannelMessageSaga,
      publicChannelsActions.sendInitialChannelMessage({
        channelName: localGeneralChannel.name,
        channelId: localGeneralChannel.id,
        type: ChannelType.CHANNEL,
      })
    )
      .withReducer(reducer)
      .withState(stateWithNoSubscriptions)
      .dispatch(publicChannelsActions.setChannelSubscribed({ channelId: generateTestChannelId('unrelated') }))
      .dispatch(publicChannelsActions.setChannelSubscribed({ channelId: localGeneralChannel.id }))
      .put(publicChannelsActions.setCurrentChannel({ channelId: localGeneralChannel.id }))
      .put(publicChannelsActions.finishGeneralRecreation())
      .put(messagesActions.sendMessage(expectedMessagePayload))
      .run()
  })

  test('finishes general recreation before waiting to queue the recreation message', async () => {
    const localStore = prepareStore().store
    const localFactory = await getReduxStoreFactory(localStore)
    const localCommunity = await localFactory.create('Community')
    const localOwner = await localFactory.create('Identity', {
      communityId: localCommunity.id,
      userId: 'orderedOwnerUserId',
    })
    const localOwnerUserProfile = await localFactory.create('UserProfile', {
      userId: localOwner.userId,
    })
    const localGeneralChannel = publicChannelsSelectors.generalChannel(localStore.getState())
    if (!localGeneralChannel) throw new Error('No general channel')
    const expectedMessage = generalChannelDeletionMessage(localOwnerUserProfile.nickname)
    const expectedMessagePayload = {
      type: 3,
      message: expectedMessage,
      channelId: localGeneralChannel.id,
    }
    const generator = sendInitialChannelMessageSaga(
      publicChannelsActions.sendInitialChannelMessage({
        channelName: localGeneralChannel.name,
        channelId: localGeneralChannel.id,
        type: ChannelType.CHANNEL,
      })
    )

    generator.next()
    generator.next(localGeneralChannel)
    generator.next(true)
    generator.next(localOwnerUserProfile)

    const setCurrentChannelEffect = generator.next(expectedMessage).value as any
    expect(setCurrentChannelEffect.payload.action).toEqual(
      publicChannelsActions.setCurrentChannel({ channelId: localGeneralChannel.id })
    )

    const finishGeneralRecreationEffect = generator.next().value as any
    expect(finishGeneralRecreationEffect.payload.action).toEqual(publicChannelsActions.finishGeneralRecreation())

    generator.next()
    const sendMessageEffect = generator.next(true).value as any
    expect(sendMessageEffect.payload.action).toEqual(messagesActions.sendMessage(expectedMessagePayload))
  })
})
