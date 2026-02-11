import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type FactoryGirl } from 'factory-girl'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { filesActions } from '../files.slice'
import { messagesActions } from '../../messages/messages.slice'
import { updateMessageMediaSaga } from './updateMessageMedia'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { usersActions } from '../../users/users.slice'
import { DateTime } from 'luxon'
import { type Community, type Identity, MessageType, type Channel, PROFILE_PHOTO_CHANNEL_ID } from '@quiet/types'
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { generateChannelId } from '@quiet/common'
import { getReduxStoreFactory } from '../../../utils/tests/factories'

describe('downloadedFileSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let sailingChannel: Channel

  let generalChannel: Channel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    alice = await factory.create('Identity', {
      communityId: community.id,
    })

    sailingChannel = (
      await factory.create('Channel', {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateChannelId('sailing'),
        },
      })
    ).channel
  })

  test('update message media', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: 'general',
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
        channelId: generalChannel.id,
      },
    }

    const message = (
      await factory.create('TestMessage', {
        identity: alice,
        message: {
          id,
          type: MessageType.Basic,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
          media: metadata,
        },
      })
    ).message

    const reducer = combineReducers(testReducers)
    await expectSaga(updateMessageMediaSaga, filesActions.updateMessageMedia(metadata))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.addMessages({
          messages: [
            {
              ...message,
              media: metadata,
            },
          ],
          isVerified: true,
        })
      )
      .run()
  })

  test('update message media for non-active channel', async () => {
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: sailingChannel.id,
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
        channelId: generalChannel.id,
      },
    }

    const message = (
      await factory.create('TestMessage', {
        identity: alice,
        message: {
          id,
          type: MessageType.Basic,
          message: '',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
          media: metadata,
        },
      })
    ).message

    const reducer = combineReducers(testReducers)
    await expectSaga(updateMessageMediaSaga, filesActions.updateMessageMedia(metadata))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        messagesActions.addMessages({
          messages: [
            {
              ...message,
              media: metadata,
            },
          ],
          isVerified: true,
        })
      )
      .run()
  })

  test('update profile photo media', async () => {
    const id = 'profile-photo-id'
    const cid = 'profile-photo-cid'

    const metadata = {
      cid,
      path: 'dir/profile.png',
      name: 'profile',
      ext: 'png',
      message: {
        id,
        channelId: PROFILE_PHOTO_CHANNEL_ID,
      },
    }

    const userProfileWithPhoto = {
      ...alice,
      nickname: 'alice',
      profilePhoto: {
        cid,
        path: null,
      },
    }

    const updatedUserProfile = {
      ...userProfileWithPhoto,
      profilePhoto: metadata,
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(updateMessageMediaSaga, filesActions.updateMessageMedia(metadata))
      .withReducer(reducer)
      .withState({
        ...store.getState(),
        Users: {
          ...store.getState().Users,
          userProfiles: {
            [alice.userId]: userProfileWithPhoto,
          },
        },
      })
      .put(usersActions.updateUserProfiles([updatedUserProfile]))
      .run()
  })
})
