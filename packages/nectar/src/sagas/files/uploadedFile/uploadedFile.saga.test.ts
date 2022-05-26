import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { uploadedFileSaga } from './uploadedFile.saga'
import { FactoryGirl } from 'factory-girl'
import { PublicChannel } from '../../publicChannels/publicChannels.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { FileMetadata } from '../../files/files.types'
import { messagesActions } from '../../messages/messages.slice'
import { DateTime } from 'luxon'
import { MessageType } from '../../messages/messages.types'

describe('uploadedFileSaga', () => {
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

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
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
      )
    ).channel
  })

  test('uploaded file', async () => {
    const metadata: FileMetadata = {
      path: 'temp/name.ext',
      name: 'name',
      ext: 'ext',
      cid: 'cid'
    }
    const reducer = combineReducers(reducers)
    await expectSaga(uploadedFileSaga, messagesActions.uploadedFile(metadata))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.sendMessage({
          message: '',
          type: MessageType.Image,
          media: metadata
        })
      )
      .run()
  })
})
