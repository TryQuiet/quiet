import { FileMetadata } from '@quiet/types'
import { Image } from 'react-native'

import { Jdenticon } from '../Jdenticon/Jdenticon.component'
import { ProfilePhotoProps } from './ProfilePhoto.types'

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  username,
  userId,
  photo,
  profilePhoto,
  alt,
  borderRadius = 2,
  size = 37,
}) => {
  const imgStyle = {
    width: size,
    height: size,
    borderRadius,
  }
  const photoAltText = alt ?? `${username}'s profile image`
  return photo ? (
    <Image style={imgStyle} source={{ uri: photo }} alt={photoAltText} />
  ) : profilePhoto ? (
    <Image style={imgStyle} source={{ uri: `file://${profilePhoto.path}` }} alt={photoAltText} />
  ) : (
    <Jdenticon value={userId} size={size} />
  )
}
