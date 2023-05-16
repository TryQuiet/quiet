import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, MessageType, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { filesActions } from '../files.slice'
import { FactoryGirl } from 'factory-girl'
import { broadcastHostedFileSaga } from './broadcastHostedFile.saga'
import { PublicChannel } from '../../publicChannels/publicChannels.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { FileMetadata } from '../files.types'
import { generateChannelAddress } from '@quiet/common'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'

describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel
  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )
    generalChannel = publicChannelsSelectors.generalChannel(store.getState())
    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: 'sailing',
            description: 'Welcome to #sailing',
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: generateChannelAddress('sailing')
          }
        }
      )
    ).channel
  })

  test('broadcast message for hosted file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    store.dispatch(publicChannelsActions.setCurrentChannel({
      channelAddress: generalChannel.address
    }))

    const id = Math.random().toString(36).substr(2.9)

    const media: FileMetadata = {
      cid: 'cid',
      path: 'path/to/file.ext',
      name: 'file',
      ext: 'ext',
      message: {
        id: id,
        channelAddress: generalChannel.address
      }
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: id,
            type: MessageType.File,
            message: '',
            createdAt: DateTime.utc().valueOf(),
            channelAddress: generalChannel.address,
            signature: '',
            pubKey: '',
            media: media
          }
        }
      )
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(broadcastHostedFileSaga, socket, filesActions.broadcastHostedFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: alice.peerId.id,
          message: {
            ...message,
            media: {
              ...media,
              path: null
            }
          }
        }
      ])
      .run()
  })

  test('broadcast message for hosted file (while on non-active channel)', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    store.dispatch(publicChannelsActions.setCurrentChannel({
      channelAddress: sailingChannel.address
    }))

    const id = Math.random().toString(36).substr(2.9)

    const media: FileMetadata = {
      cid: 'cid',
      path: 'path/to/file.ext',
      name: 'file',
      ext: 'ext',
      message: {
        id: id,
        channelAddress: generalChannel.address
      }
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: id,
            type: MessageType.File,
            message: '',
            createdAt: DateTime.utc().valueOf(),
            channelAddress: generalChannel.address,
            signature: '',
            pubKey: '',
            media: media
          }
        }
      )
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(broadcastHostedFileSaga, socket, filesActions.broadcastHostedFile(media))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_MESSAGE,
        {
          peerId: alice.peerId.id,
          message: {
            ...message,
            media: {
              ...media,
              path: null
            }
          }
        }
      ])
      .run()
  })
})
