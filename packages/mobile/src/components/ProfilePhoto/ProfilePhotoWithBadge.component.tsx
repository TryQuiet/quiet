import React from 'react'
import { ProfilePhoto } from './ProfilePhoto.component'
import { randomUUID } from 'crypto'
import { ProfilePhotoSize, type DmChannelUserData, type ProfilePhotoWithBadgeProps } from './ProfilePhoto.types'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Badge } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'
import { ChannelType, type PublicChannelStorage, type UserProfile } from '@quiet/types'

const MAX_BADGE_MEMBER_COUNT = 9

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -4,
    borderWidth: 1,
  },
  badgeConnected: {
    backgroundColor: defaultTheme.palette.background.grassGreen,
  },
  badgeNotConnected: {
    backgroundColor: defaultTheme.palette.background.grayBadge,
  },
  badgeWithContent: {
    borderRadius: 2,
    backgroundColor: defaultTheme.palette.background.grayBadge,
    color: defaultTheme.palette.typography.main,
  },
  wrapper: {},
})

export const getUserData = (
  channel: PublicChannelStorage,
  connectedPeers: string[],
  userProfiles: Record<string, UserProfile>,
  me?: UserProfile
): DmChannelUserData | undefined => {
  if (channel.memberIds == null || channel.type !== ChannelType.DM) {
    return undefined
  }

  let representativeUserId: string | undefined = undefined
  if (channel.memberIds.length === 1) {
    representativeUserId = channel.memberIds[0]
  } else {
    representativeUserId =
      channel.memberIds.find(memberId => memberId !== me?.userId && userProfiles[memberId] != null) ?? me?.userId
  }

  if (representativeUserId == null) {
    return undefined
  }

  const userProfile = userProfiles[representativeUserId]
  return {
    connected: userProfile.userData != null && connectedPeers.includes(userProfile.userData.peerId),
    user: userProfile,
  }
}

export const ProfilePhotoWithBadge: React.FC<ProfilePhotoWithBadgeProps> = ({
  channel,
  userData,
  size = ProfilePhotoSize.SMALL,
  photoBorderRadius = 4,
  badgeBorderColor = defaultTheme.palette.background.white,
}) => {
  let badgeContent: number | string | undefined = undefined
  const connected = userData?.connected ?? false
  let visible = userData?.connected != undefined
  let groupDm = false
  let badgeSize = 11
  if (channel && channel.memberIds != null && channel.memberIds.length > 2) {
    const count = channel.memberIds.length - 1
    badgeContent = count <= MAX_BADGE_MEMBER_COUNT ? count : `${MAX_BADGE_MEMBER_COUNT}+`
    visible = true
    groupDm = true
    badgeSize = 16
  }
  let componentSize: number
  switch (size) {
    case ProfilePhotoSize.SMALL:
      componentSize = 24
      break
    case ProfilePhotoSize.MEDIUM_SMALL:
      componentSize = 30
      break
    case ProfilePhotoSize.MEDIUM:
      componentSize = 37
      break
    case ProfilePhotoSize.LARGE:
      componentSize = 48
      break
    default:
      throw Error(`Invalid profile photo size: ${size}`)
  }

  return (
    <View style={styles.wrapper}>
      <ProfilePhoto
        username={userData?.user.nickname ?? randomUUID()}
        userId={userData?.user.userId ?? randomUUID()}
        size={componentSize}
        photo={userData?.user.photo}
        profilePhoto={userData?.user.profilePhoto}
        borderRadius={photoBorderRadius}
      />
      <Badge
        style={[
          styles.badge,
          groupDm ? styles.badgeWithContent : connected ? styles.badgeConnected : styles.badgeNotConnected,
          { top: componentSize - badgeSize + 2, borderColor: badgeBorderColor },
        ]}
        visible={visible}
        size={badgeSize}
      >
        {badgeContent}
      </Badge>
    </View>
  )
}
