import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { FactoryGirl } from 'factory-girl'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { filesActions } from '../files.slice'
import { messagesActions } from '../../messages/messages.slice'
import { updateMessageMediaSaga } from './updateMessageMedia'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { Community, Identity, MessageType, PublicChannel } from '@quiet/types'

describe('downloadedFileSaga', () => {
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

  test('update message media', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: 'general'
      })
    )

    const id = Math.random().toString(36).substr(2.9)

    const metadata = {
      cid: 'cid',
      path: 'dir/image.png',
      name: 'image',
      ext: 'png',
      message: {
        id: id,
        channelAddress: 'general'
      }
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: id,
            type: MessageType.Basic,
            message: '',
            createdAt: DateTime.utc().valueOf(),
            channelAddress: 'general',
            signature: '',
            pubKey: '',
            media: metadata
          }
        }
      )
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(updateMessageMediaSaga, filesActions.updateMessageMedia(metadata))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.incomingMessages({
          messages: [
            {
              ...message,
              media: metadata
            }
          ],
          isVerified: true
        })
      )
      .run()
  })

  test('update message media for non-active channel', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: sailingChannel.address
      })
    )

    const id = Math.random().toString(36).substr(2.9)

    const metadata = {
      cid: 'cid',
      path: 'dir/image.png',
      name: 'image',
      ext: 'png',
      message: {
        id: id,
        channelAddress: 'general'
      }
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: id,
            type: MessageType.Basic,
            message: '',
            createdAt: DateTime.utc().valueOf(),
            channelAddress: 'general',
            signature: '',
            pubKey: '',
            media: metadata
          }
        }
      )
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(updateMessageMediaSaga, filesActions.updateMessageMedia(metadata))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.incomingMessages({
          messages: [
            {
              ...message,
              media: metadata
            }
          ],
          isVerified: true
        })
      )
      .run()
  })
})
