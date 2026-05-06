import { getProfilePhotoSource, createDisplayProfile } from './userProfile.utils'
import { UserProfile, FileMetadata } from '@quiet/types'

describe('userProfile.utils', () => {
  let mockUserProfile: UserProfile
  let mockFileMetadata: FileMetadata

  beforeEach(() => {
    mockFileMetadata = {
      name: 'profile-photo',
      ext: '.jpg',
      path: 'mock-path',
      cid: 'test-cid',
      size: 1024,
      width: 200,
      height: 200,
      message: {
        id: 'profile-photo-test-id',
        channelId: 'profile-photo',
      },
    }

    mockUserProfile = {
      userId: 'test-user-id',
      nickname: 'Test User',
      bio: 'Test bio',
    }
  })

  describe('getProfilePhotoSource', () => {
    it('should return attachment-based photo when available', () => {
      mockUserProfile.profilePhoto = mockFileMetadata
      mockUserProfile.photo = 'base64-photo-data'

      const result = getProfilePhotoSource(mockUserProfile)
      expect(result).toBe(mockFileMetadata)
    })

    it('should return base64 photo when attachment-based photo is not available', () => {
      mockUserProfile.photo = 'base64-photo-data'

      const result = getProfilePhotoSource(mockUserProfile)
      expect(result).toBe('base64-photo-data')
    })

    it('should return undefined when no photo is available', () => {
      const result = getProfilePhotoSource(mockUserProfile)
      expect(result).toBeUndefined()
    })
  })

  describe('createDisplayProfile', () => {
    it('should create display profile with attachment-based photo', () => {
      mockUserProfile.profilePhoto = mockFileMetadata
      mockUserProfile.photo = 'base64-photo-data'

      const result = createDisplayProfile(mockUserProfile)

      expect(result.profilePhoto).toBe(mockFileMetadata)
      expect(result.photo).toBeUndefined() // Should be cleared for display
      expect(result.userId).toBe(mockUserProfile.userId)
      expect(result.nickname).toBe(mockUserProfile.nickname)
      expect(result.bio).toBe(mockUserProfile.bio)
    })

    it('should create display profile with base64 photo', () => {
      mockUserProfile.photo = 'base64-photo-data'

      const result = createDisplayProfile(mockUserProfile)

      expect(result.profilePhoto).toBeUndefined()
      expect(result.photo).toBe('base64-photo-data')
      expect(result.userId).toBe(mockUserProfile.userId)
      expect(result.nickname).toBe(mockUserProfile.nickname)
      expect(result.bio).toBe(mockUserProfile.bio)
    })

    it('should create display profile with no photo', () => {
      const result = createDisplayProfile(mockUserProfile)

      expect(result.profilePhoto).toBeUndefined()
      expect(result.photo).toBeUndefined()
      expect(result.userId).toBe(mockUserProfile.userId)
      expect(result.nickname).toBe(mockUserProfile.nickname)
      expect(result.bio).toBe(mockUserProfile.bio)
    })
  })
})
