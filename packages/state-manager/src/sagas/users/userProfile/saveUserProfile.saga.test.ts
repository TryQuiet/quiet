import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { saveUserProfileSaga } from './saveUserProfile.saga'
import { usersActions } from '../users.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { userProfileSelectors } from './userProfile.selectors'
import { generateMessageId } from '../../messages/utils/message.utils'
import { getFileData } from '@quiet/common'
import { SocketActions, imagesExtensions } from '@quiet/types'
import { Socket, applyEmitParams } from '../../../types'
import fs from 'fs'
import * as matchers from 'redux-saga-test-plan/matchers'

describe('saveUserProfile saga - IPFS photo upload', () => {
  const mockSocket = {
    emitWithAck: jest.fn(),
  } as unknown as Socket

  const mockIdentity = {
    userId: 'user123',
    networkInfo: { peerId: { id: 'peer123' } },
  }

  const mockUserProfile = {
    userId: 'user123',
    nickname: 'TestUser',
    bio: 'Test bio',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should reject photo file without path property', async () => {
    const photoFile = {
      // Missing path property
      name: 'test.jpg',
      type: 'image/jpeg',
    } as any

    await expectSaga(saveUserProfileSaga, mockSocket, usersActions.saveUserProfile({ photo: photoFile }))
      .provide([[select(identitySelectors.currentIdentity), mockIdentity]])
      .put(usersActions.setSaveUserProfileError('Photo file is missing path property'))
      .run()
  })

  it('should reject non-image file types', async () => {
    const photoFile = {
      path: '/tmp/test.pdf',
      name: 'test.pdf',
      type: 'application/pdf',
    } as any

    jest.spyOn(fs, 'statSync').mockReturnValue({ size: 1000000 } as any)

    await expectSaga(saveUserProfileSaga, mockSocket, usersActions.saveUserProfile({ photo: photoFile }))
      .provide([
        [select(identitySelectors.currentIdentity), mockIdentity],
        [
          call(getFileData, '/tmp/test.pdf'),
          {
            '123': {
              path: '/tmp/test.pdf',
              name: 'test',
              ext: '.pdf',
            },
          },
        ],
      ])
      .put(usersActions.setSaveUserProfileError('Invalid file type. Please select an image file (.gif, .png, .jpg)'))
      .run()
  })

  it('should reject oversized photo files', async () => {
    const photoFile = {
      path: '/tmp/large-photo.jpg',
      name: 'large-photo.jpg',
      type: 'image/jpeg',
    } as any

    // Mock file size > 5MB
    const largeFileSize = 6 * 1024 * 1024
    jest.spyOn(fs, 'statSync').mockReturnValue({ size: largeFileSize } as any)

    await expectSaga(saveUserProfileSaga, mockSocket, usersActions.saveUserProfile({ photo: photoFile }))
      .provide([
        [select(identitySelectors.currentIdentity), mockIdentity],
        [
          call(getFileData, '/tmp/large-photo.jpg'),
          {
            '123': {
              path: '/tmp/large-photo.jpg',
              name: 'large-photo',
              ext: '.jpg',
            },
          },
        ],
      ])
      .put(usersActions.setSaveUserProfileError('Photo file is too large (6.00MB). Maximum size is 5MB.'))
      .run()
  })

  it('should successfully create FileMetadata for valid photo', async () => {
    const photoFile = {
      path: '/tmp/test-photo.jpg',
      name: 'test-photo.jpg',
      type: 'image/jpeg',
    } as any

    const validFileSize = 2 * 1024 * 1024 // 2MB
    jest.spyOn(fs, 'statSync').mockReturnValue({ size: validFileSize } as any)

    const mockMessageId = 'msg-123'

    const mockResponse = { success: true }

    await expectSaga(saveUserProfileSaga, mockSocket, usersActions.saveUserProfile({ photo: photoFile }))
      .provide([
        [select(identitySelectors.currentIdentity), mockIdentity],
        [select(userProfileSelectors.myUserProfile), mockUserProfile],
        [call(generateMessageId), mockMessageId],
        [
          call(getFileData, '/tmp/test-photo.jpg'),
          {
            '123': {
              path: '/tmp/test-photo.jpg',
              name: 'test-photo',
              ext: '.jpg',
            },
          },
        ],
        [matchers.apply.fn(mockSocket.emitWithAck), mockResponse],
      ])
      .put.actionType('Users/setUserProfile')
      .put(usersActions.setSaveUserProfileError(null))
      .run()
  })

  it('should handle file:// protocol in path', async () => {
    const photoFile = {
      path: 'file:///tmp/test-photo.png',
      name: 'test-photo.png',
      type: 'image/png',
    } as any

    const validFileSize = 1 * 1024 * 1024
    jest.spyOn(fs, 'statSync').mockReturnValue({ size: validFileSize } as any)

    const mockMessageId = 'msg-456'
    const mockResponse = { success: true }

    await expectSaga(saveUserProfileSaga, mockSocket, usersActions.saveUserProfile({ photo: photoFile }))
      .provide([
        [select(identitySelectors.currentIdentity), mockIdentity],
        [select(userProfileSelectors.myUserProfile), mockUserProfile],
        [call(generateMessageId), mockMessageId],
        [
          call(getFileData, '/tmp/test-photo.png'), // Should strip file:// protocol
          {
            '123': {
              path: '/tmp/test-photo.png',
              name: 'test-photo',
              ext: '.png',
            },
          },
        ],
        [matchers.apply.fn(mockSocket.emitWithAck), mockResponse],
      ])
      .put.actionType('Users/setUserProfile')
      .put(usersActions.setSaveUserProfileError(null))
      .run()
  })

  it('should preserve existing profile data when updating photo', async () => {
    const photoFile = {
      path: '/tmp/new-photo.jpg',
      name: 'new-photo.jpg',
      type: 'image/jpeg',
    } as any

    const existingProfile = {
      userId: 'user123',
      nickname: 'ExistingUser',
      bio: 'Existing bio',
      photo: 'data:image/png;base64,existing',
    }

    const validFileSize = 1.5 * 1024 * 1024
    jest.spyOn(fs, 'statSync').mockReturnValue({ size: validFileSize } as any)

    const mockMessageId = 'msg-789'
    const mockResponse = { success: true }

    await expectSaga(saveUserProfileSaga, mockSocket, usersActions.saveUserProfile({ photo: photoFile }))
      .provide([
        [select(identitySelectors.currentIdentity), mockIdentity],
        [select(userProfileSelectors.myUserProfile), existingProfile],
        [call(generateMessageId), mockMessageId],
        [
          call(getFileData, '/tmp/new-photo.jpg'),
          {
            '123': {
              path: '/tmp/new-photo.jpg',
              name: 'new-photo',
              ext: '.jpg',
            },
          },
        ],
        [matchers.apply.fn(mockSocket.emitWithAck), mockResponse],
      ])
      .put.actionType('Users/setUserProfile')
      .put(usersActions.setSaveUserProfileError(null))
      .run()
  })
})
