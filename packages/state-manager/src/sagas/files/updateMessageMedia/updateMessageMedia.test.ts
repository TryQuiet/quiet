import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory, type publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type FactoryGirl } from 'factory-girl'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { filesActions } from '../files.slice'
import { messagesActions } from '../../messages/messages.slice'
import { updateMessageMediaSaga } from './updateMessageMedia'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { type Community, type Identity, MessageType, type PublicChannel } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { generateChannelId } from '@quiet/common'

describe('downloadedFileSaga', () => {
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

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

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
            id: generateChannelId('sailing')
          }
        }
      )
    ).channel
  })

  test('update message media', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: 'general'
      })
    )

    const id = Math.random().toString(36).substr(2.9)

    const metadata = {
      cid: 'cid',
      path: 'dir/image.png',
      name: 'image',
      ext: 'png',
      message: {
        id,
        channelId: generalChannel.id
      }
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id,
            type: MessageType.Basic,
            message: '',
            createdAt: DateTime.utc().valueOf(),
            channelId: generalChannel.id,
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
        channelId: sailingChannel.id
      })
    )

    const id = Math.random().toString(36).substr(2.9)

    const metadata = {
      cid: 'cid',
      path: 'dir/image.png',
      name: 'image',
      ext: 'png',
      message: {
        id,
        channelId: generalChannel.id
      }
    }

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id,
            type: MessageType.Basic,
            message: '',
            createdAt: DateTime.utc().valueOf(),
            channelId: generalChannel.id,
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
