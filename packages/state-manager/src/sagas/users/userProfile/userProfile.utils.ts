import { UserProfile, FileMetadata } from '@quiet/types'

export function getProfilePhotoSource(userProfile: UserProfile): FileMetadata | string | undefined {
  if (userProfile.profilePhoto) {
    return userProfile.profilePhoto
  }

  if (userProfile.photo) {
    return userProfile.photo
  }

  return undefined
}

export function createDisplayProfile(userProfile: UserProfile): UserProfile {
  return {
    ...userProfile,
    // Ensure only one photo field is set for display
    photo: userProfile.profilePhoto ? undefined : userProfile.photo,
    profilePhoto: userProfile.profilePhoto,
  }
}
