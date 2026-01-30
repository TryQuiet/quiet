import { usersSlice, UsersState } from './users.slice'
import { UserProfile, FileMetadata } from '@quiet/types'

describe('usersSlice', () => {
  describe('updateUserProfiles', () => {
    it('should clear profilePhoto.path if CID changes', () => {
      const userId = 'user-1'
      const oldCid = 'old-cid'
      const newCid = 'new-cid'

      const initialState: UsersState = {
        userProfiles: {
          [userId]: {
            userId,
            nickname: 'alice',
            profilePhoto: {
              cid: oldCid,
              path: '/path/to/old/photo.png',
              name: 'photo',
              ext: '.png',
              message: { id: 'mid-1', channelId: 'PROFILE_PHOTO_CHANNEL_ID' },
            } as FileMetadata,
          } as UserProfile,
        },
        users: {},
        saveUserProfileError: null,
      }

      const updatedProfile: UserProfile = {
        userId,
        nickname: 'alice',
        profilePhoto: {
          cid: newCid,
          path: null, // Backend sends null path
          name: 'photo',
          ext: '.png',
          message: { id: 'mid-2', channelId: 'PROFILE_PHOTO_CHANNEL_ID' },
        } as FileMetadata,
      }

      const nextState = usersSlice.reducer(initialState, usersSlice.actions.updateUserProfiles([updatedProfile]))

      expect(nextState.userProfiles[userId].profilePhoto?.cid).toBe(newCid)
      expect(nextState.userProfiles[userId].profilePhoto?.path).toBeNull()
    })

    it('should NOT clear profilePhoto.path if CID is the same', () => {
      const userId = 'user-1'
      const cid = 'same-cid'
      const path = '/path/to/photo.png'

      const initialState: UsersState = {
        userProfiles: {
          [userId]: {
            userId,
            nickname: 'alice',
            profilePhoto: {
              cid,
              path,
              name: 'photo',
              ext: '.png',
              message: { id: 'mid-1', channelId: 'PROFILE_PHOTO_CHANNEL_ID' },
            } as FileMetadata,
          } as UserProfile,
        },
        users: {},
        saveUserProfileError: null,
      }

      const updatedProfile: UserProfile = {
        userId,
        nickname: 'alice-updated',
        profilePhoto: {
          cid,
          path: null, // Backend might send null path even if we have it locally
          name: 'photo',
          ext: '.png',
          message: { id: 'mid-1', channelId: 'PROFILE_PHOTO_CHANNEL_ID' },
        } as FileMetadata,
      }

      const nextState = usersSlice.reducer(initialState, usersSlice.actions.updateUserProfiles([updatedProfile]))

      expect(nextState.userProfiles[userId].nickname).toBe('alice-updated')
      expect(nextState.userProfiles[userId].profilePhoto?.cid).toBe(cid)
      expect(nextState.userProfiles[userId].profilePhoto?.path).toBe(path)
    })
  })
})
