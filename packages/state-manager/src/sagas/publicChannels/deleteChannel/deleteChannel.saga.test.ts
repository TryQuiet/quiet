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
import { type communitiesActions } from '../../communities/communities.slice'
import { DateTime } from 'luxon'
import { deleteChannelSaga } from './deleteChannel.saga'
import { type Socket } from 'socket.io-client'
import { generateChannelId } from '@quiet/common'
import { filesActions } from '../../files/files.slice'
import {
  type Community,
  type Identity,
  type PublicChannel,
  SocketActionTypes,
  DeleteChannelResponse,
} from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { usersSelectors } from '../../users/users.selectors'

describe('deleteChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let owner: Identity

  let photoChannel: PublicChannel
  let generalChannel: PublicChannel

  let ownerData: {
    username: string | null
    onionAddress: string | null
    peerId: string | null
    dmPublicKey: string | null
    pubKey: string
  } | null

  const socket = { emit: jest.fn(), emitWithAck: jest.fn(), on: jest.fn() } as unknown as Socket

  beforeEach(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    owner = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })
    ownerData = usersSelectors.ownerData(store.getState())
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

  test('delete standard channel', async () => {
    console.log({ generalChannel })
    const channelId = photoChannel.id
    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId }))
    const reducer = combineReducers(reducers)
    await expectSaga(deleteChannelSaga, socket, publicChannelsActions.deleteChannel({ channelId }))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [
        SocketActionTypes.DELETE_CHANNEL,
        {
          channelId,
          ownerPeerId: ownerData?.peerId,
        },
      ])
      .put(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
      .put(publicChannelsActions.disableChannel({ channelId }))
      .run()
  })

  test('delete general channel', async () => {
    const channelId = generalChannel.id

    const reducer = combineReducers(reducers)
    await expectSaga(deleteChannelSaga, socket, publicChannelsActions.deleteChannel({ channelId }))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [
        SocketActionTypes.DELETE_CHANNEL,
        {
          channelId,
          ownerPeerId: ownerData?.peerId,
        },
      ])
      .put(filesActions.deleteFilesFromChannel({ channelId }))
      .run()
  })

  test('delete standard channel - already disabled', async () => {
    const channelId = photoChannel.id
    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId }))
    store.dispatch(publicChannelsActions.disableChannel({ channelId }))
    const reducer = combineReducers(reducers)
    await expectSaga(deleteChannelSaga, socket, publicChannelsActions.deleteChannel({ channelId }))
      .withReducer(reducer)
      .withState(store.getState())
      .not.apply(socket, socket.emitWithAck, [
        SocketActionTypes.DELETE_CHANNEL,
        {
          channelId,
          ownerPeerId: ownerData?.peerId,
        },
      ])
      .not.put(publicChannelsActions.setCurrentChannel({ channelId: generalChannel.id }))
      .not.put(publicChannelsActions.disableChannel({ channelId }))
      .run()
  })

  test('delete standard channel when currentChannel is not specified - mobile channel list case', async () => {
    const channelId = photoChannel.id
    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId: '' }))
    const reducer = combineReducers(reducers)
    await expectSaga(deleteChannelSaga, socket, publicChannelsActions.deleteChannel({ channelId }))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [
        SocketActionTypes.DELETE_CHANNEL,
        {
          channelId,
          ownerPeerId: ownerData?.peerId,
        },
      ])
      .put(publicChannelsActions.disableChannel({ channelId }))
      .run()
  })
})
