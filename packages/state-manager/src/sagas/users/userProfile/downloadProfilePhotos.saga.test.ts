import { expectSaga } from 'redux-saga-test-plan'
import { downloadProfilePhotosSaga } from './downloadProfilePhotos.saga'
import { usersActions } from '../users.slice'
import { filesActions } from '../../files/files.slice'
import { UserProfile, FileMetadata } from '@quiet/types'

describe('downloadProfilePhotosSaga', () => {
  const mockFileMetadata: FileMetadata = {
    cid: 'mock-cid',
    name: 'mock-name',
    ext: '.png',
    path: null,
    message: {
      id: 'mock-mid',
      channelId: 'PROFILE_PHOTO_CHANNEL_ID',
    },
  }

  const mockProfile: UserProfile = {
    userId: 'user-1',
    nickname: 'alice',
    profilePhoto: mockFileMetadata,
  }

  it('should trigger download if path is missing', async () => {
    await expectSaga(downloadProfilePhotosSaga)
      .dispatch(usersActions.updateUserProfiles([mockProfile]))
      .put(filesActions.downloadFile(mockFileMetadata))
      .silentRun()
  })

  it('should not trigger download if path is present', async () => {
    const profileWithPath = {
      ...mockProfile,
      profilePhoto: {
        ...mockFileMetadata,
        path: '/path/to/photo.png',
      },
    }

    await expectSaga(downloadProfilePhotosSaga)
      .dispatch(usersActions.updateUserProfiles([profileWithPath]))
      .not.put(filesActions.downloadFile(profileWithPath.profilePhoto))
      .silentRun()
  })

  it('should not trigger download if profilePhoto is missing', async () => {
    const profileWithoutPhoto = {
      ...mockProfile,
      profilePhoto: undefined,
    }

    await expectSaga(downloadProfilePhotosSaga)
      .dispatch(usersActions.updateUserProfiles([profileWithoutPhoto]))
      .not.put.actionType(filesActions.downloadFile.type)
      .silentRun()
  })
})
