import {
  setupCrypto
} from '@quiet/identity'
import { call } from 'redux-saga-test-plan/matchers'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { Socket } from 'socket.io-client'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { uploadFileSaga } from './uploadFile.saga'
import { FactoryGirl } from 'factory-girl'
import { PublicChannel } from '../../publicChannels/publicChannels.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { currentChannelAddress } from '../../publicChannels/publicChannels.selectors'
import { FileMetadata } from '../../files/files.types'
import { filesActions } from '../files.slice'
import { generateMessageId } from '../../messages/utils/message.utils'
import { DateTime } from 'luxon'

describe('uploadFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: PublicChannel

  let messageId: string

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
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          address: 'sailing'
        }
      }
    )).channel

    messageId = '1'
  })

  test('uploading file', async () => {
    const socket = { emit: jest.fn() } as unknown as Socket

    const currentChannel = currentChannelAddress(store.getState())

    const peerId = alice.peerId.id

    const fileContent: FileMetadata = {
      cid: `uploading_${messageId}`,
      path: 'temp/name.ext',
      name: 'name',
      ext: 'ext',
      message: {
        id: messageId,
        channelAddress: currentChannel
      }
    }
    const reducer = combineReducers(reducers)
    await expectSaga(
      uploadFileSaga,
      socket,
      filesActions.uploadFile(fileContent)
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), messageId]
      ])
      .apply(socket, socket.emit, [
        SocketActionTypes.UPLOAD_FILE,
        {
          file: fileContent,
          peerId
        }
      ])
      .run()
  })
})
