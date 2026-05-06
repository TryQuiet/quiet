import { expectSaga } from 'redux-saga-test-plan'
import { Blob } from 'buffer'
import { call, select } from 'redux-saga-test-plan/matchers'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'

import { getReduxStoreFactory } from '../../..'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getBaseTypesFactory, getSocketFactory } from '../../../utils/tests/factories'

import { saveUserProfileSaga } from './saveUserProfile.saga'
import { usersActions } from '../users.slice'
import { filesActions } from '../../files/files.slice'
import { filesSelectors } from '../../files/files.selectors'
import { generateMessageId } from '../../messages/utils/message.utils'

import {
  type Identity,
  type UserProfile,
  type FileMetadata,
  DownloadState,
  PROFILE_PHOTO_CHANNEL_ID,
  SocketActions,
} from '@quiet/types'
import { type Socket } from '../../../types'

describe('saveUserProfileSaga', () => {
  let store: Store
  let reduxFactory: FactoryGirl
  let baseTypesFactory: FactoryGirl
  let socket: MockedSocket
  let identity: Identity
  let userProfile: UserProfile

  beforeEach(async () => {
    socket = new MockedSocket()

    // Make SET_USER_PROFILE succeed deterministically.
    socket.registerExpectedResponse(SocketActions.SET_USER_PROFILE, { success: true })

    store = prepareStore().store
    reduxFactory = await getReduxStoreFactory(store)
    baseTypesFactory = await getBaseTypesFactory()

    identity = await reduxFactory.create('Identity')
    userProfile = await reduxFactory.create('UserProfile', { userId: identity.userId })
  })

  const makeFile = (name: string, path: string): File => {
    return Object.assign(new Blob([]), { name, path }) as any as File
  }

  const makeUploadStatusAction = (mid: string, downloadState: DownloadState) =>
    filesActions.updateDownloadStatus({
      mid,
      cid: `attaching_${mid}`,
      downloadState,
      downloadProgress: undefined,
    })

  test('uploads profile photo via ATTACH_FILE and saves profile with attachment-based profilePhoto', async () => {
    const fixedId = 'fixed-upload-id'
    const profilePhotoMessageId = `profile-photo-${identity.userId}-${fixedId}`

    const uploadedMetadata: FileMetadata = {
      name: `profile-photo-${identity.userId}`,
      ext: '.jpg',
      path: '/tmp/profile-photo.jpg',
      cid: 'bafy-test-cid',
      message: {
        id: profilePhotoMessageId,
        channelId: PROFILE_PHOTO_CHANNEL_ID,
      },
    }

    let profilePhotosSelectCalls = 0

    let takeCalls = 0
    const provideTake = () => ({
      take(effect: any, next: any) {
        // The saga only takes updateDownloadStatus inside the upload loop.
        // We return a Hosted status for our upload MID.
        takeCalls += 1
        if (takeCalls === 1) {
          return makeUploadStatusAction(profilePhotoMessageId, DownloadState.Hosted)
        }
        return next()
      },
    })

    const photo = makeFile('photo.jpg', '/tmp/photo.jpg')

    await expectSaga(
      saveUserProfileSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.saveUserProfile({ photo, nickname: userProfile.nickname, bio: userProfile.bio })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        // deterministic upload message id
        [call.fn(generateMessageId), fixedId],
        {
          select: ({ selector }: any, next: any) => {
            if (selector === filesSelectors.profilePhotos) {
              profilePhotosSelectCalls += 1
              // In the first test, we expect it to be empty initially, then contain the uploaded metadata.
              // But wait, the saga now ALWAYS uploads, so it will always call select(profilePhotos) AFTER Hosted.
              return { [profilePhotoMessageId]: uploadedMetadata }
            }
            return next()
          },
          take: provideTake().take,
        },
      ])
      .put.like({
        action: {
          type: filesActions.updateDownloadStatus.type,
          payload: {
            mid: profilePhotoMessageId,
            downloadState: DownloadState.Attaching,
          },
        },
      })
      .call.like({ context: socket, fn: socket.emit })
      .call.like({
        context: socket,
        fn: socket.emitWithAck,
        args: [
          SocketActions.SET_USER_PROFILE,
          {
            profile: {
              userId: identity.userId,
              nickname: userProfile.nickname,
              bio: userProfile.bio,
              profilePhoto: {
                ...uploadedMetadata,
                path: null,
              },
              photo: undefined,
            },
          },
        ],
      })
      .put.like({
        action: {
          type: usersActions.setUserProfile.type,
          payload: {
            userId: identity.userId,
            photo: undefined,
            profilePhoto: uploadedMetadata,
          },
        },
      })
      .put.like({
        action: { type: usersActions.setSaveUserProfileError.type, payload: null },
      })
      .run()
  })

  test('handles profile photo upload failure (Canceled) by setting error and aborting save', async () => {
    const fixedId = 'fixed-fail-id'
    const profilePhotoMessageId = `profile-photo-${identity.userId}-${fixedId}`

    let takeCalls = 0
    const provideTake = () => ({
      take(effect: any, next: any) {
        takeCalls += 1
        if (takeCalls === 1) {
          return makeUploadStatusAction(profilePhotoMessageId, DownloadState.Canceled)
        }
        return next()
      },
    })

    const photo = makeFile('photo.jpg', '/tmp/photo.jpg')

    await expectSaga(
      saveUserProfileSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.saveUserProfile({ photo, nickname: userProfile.nickname, bio: userProfile.bio })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([[call.fn(generateMessageId), fixedId], { take: provideTake().take }])
      .put.like({
        action: {
          type: filesActions.updateDownloadStatus.type,
          payload: {
            mid: profilePhotoMessageId,
            downloadState: DownloadState.Attaching,
          },
        },
      })
      .call.like({ context: socket, fn: socket.emit })
      .put.like({
        action: { type: usersActions.setSaveUserProfileError.type, payload: 'Profile photo upload failed' },
      })
      // Must not call SET_USER_PROFILE when upload failed
      .not.call.like({ context: socket, fn: socket.emitWithAck })
      .not.put.like({ action: { type: usersActions.setUserProfile.type } })
      .run()
  })

  test('when no profile photo is provided, saves profile without touching upload flow', async () => {
    await expectSaga(
      saveUserProfileSaga,
      socket as unknown as Socket,
      usersActions.saveUserProfile({ photo: undefined, nickname: userProfile.nickname, bio: userProfile.bio })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      // Must not generate upload message IDs or emit ATTACH_FILE
      .not.call.fn(generateMessageId)
      .not.call.like({ context: socket, fn: socket.emit })
      // Should call SET_USER_PROFILE
      .call.like({ context: socket, fn: socket.emitWithAck })
      // Should keep existing base64 photo and set profilePhoto undefined
      .put.like({
        action: {
          type: usersActions.setUserProfile.type,
          payload: {
            userId: identity.userId,
            photo: userProfile.photo,
            profilePhoto: undefined,
          },
        },
      })
      .put.like({ action: { type: usersActions.setSaveUserProfileError.type, payload: null } })
      .run()
  })

  test('always uploads new profile photo even if metadata exists in state', async () => {
    const existingMid = `profile-photo-${identity.userId}-existing`
    const existingMetadata: FileMetadata = {
      name: `profile-photo-${identity.userId}`,
      ext: '.jpg',
      path: '/tmp/existing-profile-photo.jpg',
      cid: 'bafy-existing-cid',
      message: {
        id: existingMid,
        channelId: PROFILE_PHOTO_CHANNEL_ID,
      },
    }

    const fixedId = 'fixed-upload-id'
    const profilePhotoMessageId = `profile-photo-${identity.userId}-${fixedId}`
    const uploadedMetadata: FileMetadata = {
      ...existingMetadata,
      cid: 'bafy-new-cid',
      message: {
        id: profilePhotoMessageId,
        channelId: PROFILE_PHOTO_CHANNEL_ID,
      },
    }

    let takeCalls = 0
    const provideTake = () => ({
      take(effect: any, next: any) {
        takeCalls += 1
        if (takeCalls === 1) {
          return makeUploadStatusAction(profilePhotoMessageId, DownloadState.Hosted)
        }
        return next()
      },
    })

    const photo = makeFile('photo.jpg', '/tmp/photo.jpg')

    await expectSaga(
      saveUserProfileSaga,
      socket as unknown as Socket,
      // @ts-ignore
      usersActions.saveUserProfile({ photo, nickname: userProfile.nickname, bio: userProfile.bio })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), fixedId],
        [
          select(filesSelectors.profilePhotos),
          { [existingMid]: existingMetadata, [profilePhotoMessageId]: uploadedMetadata },
        ],
        { take: provideTake().take },
      ])
      // Should upload again
      .call.fn(generateMessageId)
      .call.like({ context: socket, fn: socket.emit })
      // Should save profile with NEW metadata
      .call.like({
        context: socket,
        fn: socket.emitWithAck,
        args: [
          SocketActions.SET_USER_PROFILE,
          {
            profile: {
              userId: identity.userId,
              nickname: userProfile.nickname,
              bio: userProfile.bio,
              profilePhoto: {
                ...uploadedMetadata,
                path: null,
              },
              photo: undefined,
            },
          },
        ],
      })
      .run()
  })
})
