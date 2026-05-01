/**
 * `ProfilePhoto` supports both the deprecated base64-encoded photos and attachment-based photos.
 */
import React from 'react'
import type { UserProfile } from '@quiet/types'
import Jdenticon from '../Jdenticon/Jdenticon'
import { useTheme } from '@mui/material/styles'

interface ProfilePhotoProps {
  userProfile?: UserProfile
  userId: string
  className?: string
  size?: number
  style?: React.CSSProperties
  alt?: string
  borderRadius?: string | number
}

const hasProfilePhoto = (
  profile: UserProfile | undefined
): profile is UserProfile & { profilePhoto: { path: string } } => {
  return !!profile?.profilePhoto?.path
}

const getProfilePhotoPath = (profile: UserProfile | undefined): string | undefined => {
  if (hasProfilePhoto(profile)) {
    return profile.profilePhoto.path
  }
  return undefined
}

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  userProfile,
  userId,
  className,
  size = 96,
  style,
  borderRadius = 4,
  alt,
}) => {
  const theme = useTheme()
  const profilePhotoPath = getProfilePhotoPath(userProfile)

  const defaultStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius,
    marginBottom: '16px',
    ...style,
  }

  const altText = alt || userProfile?.nickname || 'User profile'

  return (
    <>
      {userProfile?.photo ? (
        <img className={className} src={userProfile.photo} alt={altText} style={defaultStyle} />
      ) : profilePhotoPath ? (
        <img className={className} src={profilePhotoPath} alt={altText} style={defaultStyle} />
      ) : (
        <Jdenticon
          value={userId}
          size={size.toString()}
          style={{
            background: theme.palette.background.paper,
            ...defaultStyle,
          }}
        />
      )}
    </>
  )
}

export default ProfilePhoto
