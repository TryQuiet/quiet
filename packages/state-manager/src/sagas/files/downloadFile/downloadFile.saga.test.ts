import {
  setupCrypto
} from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, MessageType } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { messagesActions } from '../../messages/messages.slice'
import { FactoryGirl } from 'factory-girl'
import { downloadFileSaga } from './downloadFile.saga'
import { currentChannelAddress } from '../../publicChannels/publicChannels.selectors'
import { PublicChannel } from '../../publicChannels/publicChannels.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { FileMetadata } from '../files.types'

describe('downloadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel

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

    sailingChannel = (await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
      'PublicChannel',
      {
        communityId: alice.id,
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          address: 'sailing'
        }
      }
    )).channel
  })

  test('download file of type image', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const currentChannel = currentChannelAddress(store.getState())
    const peerId = alice.peerId.id

    const messageId = '5'

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'image',
      ext: 'png',
      message: {
        id: messageId,
        channelAddress: currentChannel
      }
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      downloadFileSaga,
      socket,
      messagesActions.incomingMessages({
        communityId: community.id,
        messages: [{
          id: messageId,
          type: MessageType.Image,
          message: 'message',
          createdAt: 8,
          channelAddress: currentChannel,
          signature: 'signature',
          pubKey: 'publicKey',
          media: media
        }]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([

      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.DOWNLOAD_FILE,
        {
          peerId: peerId,
          metadata: media
        }
      ])
      .run()
  })
})
