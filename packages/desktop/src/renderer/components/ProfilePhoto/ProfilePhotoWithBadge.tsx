import React from 'react'
import { Badge, styled, useTheme } from '@mui/material'
import ProfilePhoto from './ProfilePhoto'
import { ProfilePhotoSize, ProfilePhotoWithBadgeProps } from './ProfilePhoto.types'
import { randomUUID } from 'crypto'
import classNames from 'classnames'

const PREFIX = 'ProfilePhotoWithBadge'

const classes = {
  avatar: `${PREFIX}avatar`,
  avatarSmall: `${PREFIX}avatarSmall`,
  avatarMedium: `${PREFIX}avatarMedium`,
  avatarLarge: `${PREFIX}avatarLarge`,
}

const StyledBadge = styled(Badge)(({ theme }) => ({
  '.MuiBadge-dot': {
    backgroundColor: theme.palette.colors.statusGreen,
    color: theme.palette.colors.statusGreen,
    height: theme.componentSizes.statusIndicator.size,
    width: theme.componentSizes.statusIndicator.size,
    minWidth: theme.componentSizes.statusIndicator.size,
    minHeight: theme.componentSizes.statusIndicator.size,
    borderRadius: '50%',
    border: `${theme.componentSizes.statusIndicator.borderWidth}px solid ${
      theme.palette.colors?.sidebarBackground || theme.palette.background.default
    }`,
    boxSizing: 'border-box',
    right: theme.componentSizes.statusIndicator.position.right,
    bottom: theme.componentSizes.statusIndicator.position.bottom,
    padding: 0,
    fontSize: 9,
  },

  '.MuiBadge-standard': {
    backgroundColor: theme.palette.colors.gray50,
    color: theme.palette.colors.trueBlack,
    height: 'auto',
    width: '100%',
    minWidth: theme.componentSizes.dmMemberCountIndicator.minSize,
    minHeight: theme.componentSizes.dmMemberCountIndicator.minSize,
    maxWidth: theme.componentSizes.dmMemberCountIndicator.maxSize,
    maxHeight: theme.componentSizes.dmMemberCountIndicator.maxSize,
    borderRadius: '25%',
    border: `${theme.componentSizes.dmMemberCountIndicator.borderWidth}px solid ${
      theme.palette.colors?.sidebarBackground || theme.palette.background.default
    }`,
    boxSizing: 'border-box',
    right: theme.componentSizes.dmMemberCountIndicator.position.right,
    bottom: theme.componentSizes.dmMemberCountIndicator.position.bottom,
    padding: 2,
    fontSize: theme.componentSizes.dmMemberCountIndicator.fontSize,
    lineHeight: theme.componentSizes.dmMemberCountIndicator.lineHeight,
  },
  [`& .${classes.avatar}`]: {
    marginRight: 0,
    background: theme.palette.background.paper,
  },
  [`& .${classes.avatarSmall}`]: {
    width: theme.componentSizes.avatar.small,
    height: theme.componentSizes.avatar.small,
  },
  [`& .${classes.avatarMedium}`]: {
    width: theme.componentSizes.avatar.medium,
    height: theme.componentSizes.avatar.medium,
  },
  [`& .${classes.avatarLarge}`]: {
    width: theme.componentSizes.avatar.large,
    height: theme.componentSizes.avatar.large,
  },
}))

const MAX_BADGE_MEMBER_COUNT = 9

export const ProfilePhotoWithBadge: React.FC<ProfilePhotoWithBadgeProps> = ({
  channel,
  userData,
  size = ProfilePhotoSize.SMALL,
  borderRadius = 4,
}) => {
  const theme = useTheme()
  let variant: 'dot' | 'standard' = 'dot'
  let badgeContent: number | undefined = undefined
  let invisible = !(userData?.connected ?? false)
  let groupDm = false
  let overlap: 'circular' | 'rectangular' = 'circular'
  if (channel && channel.memberIds != null && channel.memberIds.length > 2) {
    variant = 'standard'
    badgeContent = channel.memberIds.length - 1
    invisible = false
    groupDm = true
    overlap = 'rectangular'
  }
  const id = (channel ? channel.id : userData?.user.nickname) ?? randomUUID()
  let componentSize: number
  switch (size) {
    case ProfilePhotoSize.SMALL:
      componentSize = theme.componentSizes.avatar.small
      break
    case ProfilePhotoSize.MEDIUM:
      componentSize = theme.componentSizes.avatar.medium
      break
    case ProfilePhotoSize.LARGE:
      componentSize = theme.componentSizes.avatar.large
      break
    default:
      throw Error(`Invalid profile photo size: ${size}`)
  }

  return (
    <StyledBadge
      slotProps={{ badge: { 'data-testid': `${id}-profile-photo-status-badge` } as any }}
      overlap={overlap}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant={variant}
      invisible={invisible}
      badgeContent={badgeContent}
      max={MAX_BADGE_MEMBER_COUNT}
    >
      <span
        className={classNames(classes.avatar, {
          [classes.avatarSmall]: size === ProfilePhotoSize.SMALL,
          [classes.avatarMedium]: size === ProfilePhotoSize.MEDIUM,
          [classes.avatarLarge]: size === ProfilePhotoSize.LARGE,
        })}
        style={{ borderRadius }}
      >
        <ProfilePhoto
          userProfile={userData?.user}
          userId={userData?.user.userId ?? randomUUID()}
          size={componentSize}
          borderRadius={borderRadius}
        />
      </span>
    </StyledBadge>
  )
}

export default ProfilePhotoWithBadge
