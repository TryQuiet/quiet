import React, { useRef } from 'react'
import { styled, useTheme } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, ListItemButton, Grid } from '@mui/material'
import Badge from '@mui/material/Badge'
import ListItemText from '@mui/material/ListItemText'
import { PublicChannelStorage, UserProfile } from '@quiet/types'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import { DmChannelUserData } from './DirectMessagesPanel'

const PREFIX = 'UserProfileListItem'

const classes = {
  root: `${PREFIX}root`,
  avatar: `${PREFIX}avatar`,
  primary: `${PREFIX}primary`,
  nickname: `${PREFIX}nickname`,
  itemText: `${PREFIX}itemText`,
  selected: `${PREFIX}selected`,
  disabled: `${PREFIX}disabled`,
  newMessages: `${PREFIX}newMessages`,
  me: `${PREFIX}me`,
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
}))

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: 220,
    padding: `3px 16px 3px 16px`,
    gap: theme.componentSizes.userListItem.gap,
    opacity: 1,
    display: 'flex',
    backgroundColor: 'inherit',
    alignItems: 'center',
  },
  [`&:hover`]: {
    backgroundColor: theme.palette.colors?.sidebarHover || theme.palette.action.hover,
  },
  [`& .${classes.avatar}`]: {
    width: theme.componentSizes.avatar.small,
    height: theme.componentSizes.avatar.small,
    marginRight: 0,
    fontSize: 14,
    borderRadius: 4,
    background: theme.palette.background.paper,
  },
  [`& .${classes.nickname}`]: {
    fontWeight: 400,
    paddingLeft: 0,
    paddingRight: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 150,
    whiteSpace: 'nowrap',
  },
  [`& .${classes.itemText}`]: {
    margin: 0,
  },
  [`&.${classes.selected}`]: {
    backgroundColor: theme.palette.colors.sidebarSelected,
  },
  [`&.${classes.disabled}`]: {
    opacity: '0.3',
    pointerEvents: 'none',
    cursor: 'not-allowed',
  },
  [`& .${classes.newMessages}`]: {
    opacity: 1,
    fontWeight: 600,
  },
  [`& .${classes.me}`]: {
    color: theme.palette.colors.gray50,
  },

  [`&.${classes.root}:hover`]: {
    backgroundColor: theme.palette.colors.sidebarHover,
  },
}))

export interface DirectMessageListItemProps {
  channel: PublicChannelStorage
  me: UserProfile | undefined
  userProfiles: Record<string, UserProfile>
  userData: DmChannelUserData | undefined
  selected: boolean
  unread: boolean
  setCurrentChannel: (channelId: string) => void
}

interface ProfilePhotoWithBadgeProps {
  userData: DmChannelUserData | undefined
  channel: PublicChannelStorage
}

const ProfilePhotoWithBadge: React.FC<ProfilePhotoWithBadgeProps> = ({ channel, userData }) => {
  const theme = useTheme()
  let variant: 'dot' | 'standard' = 'dot'
  let badgeContent: number | undefined = undefined
  let invisible = !(userData?.connected ?? false)
  let groupDm = false
  let overlap: 'circular' | 'rectangular' = 'circular'
  if (channel.memberIds != null && channel.memberIds.length > 2) {
    variant = 'standard'
    badgeContent = channel.memberIds.length - 1
    invisible = false
    groupDm = true
    overlap = 'rectangular'
  }

  return (
    <StyledBadge
      slotProps={{ badge: { 'data-testid': `${channel.id}-dm-link-status-badge` } as any }}
      overlap={overlap}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant={variant}
      invisible={invisible}
      badgeContent={badgeContent}
      max={2}
    >
      {userData && (
        <span className={classes.avatar}>
          <ProfilePhoto
            userProfile={userData.user}
            userId={userData.user.userId}
            size={theme.componentSizes.avatar.small}
            borderRadius={8}
          />
        </span>
      )}
    </StyledBadge>
  )
}

export const DirectMessageListItem: React.FC<DirectMessageListItemProps> = ({
  channel,
  me,
  userProfiles,
  userData,
  selected,
  unread,
  setCurrentChannel,
}) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  return (
    <StyledListItemButton
      className={classNames(classes.root, {
        [classes.selected]: selected,
        [classes.disabled]: false,
      })}
      disableGutters
      data-testid={`${channel.id}-dm-link`}
      tabIndex={-1}
      onClick={() => {
        setCurrentChannel(channel.id)
      }}
      ref={ref}
    >
      <ProfilePhotoWithBadge userData={userData} channel={channel} />
      <ListItemText
        primary={
          <Grid container item display='flex' flexDirection='row' gap='8px'>
            <Typography
              variant='body2'
              className={classNames(classes.nickname, {
                [classes.newMessages]: unread,
              })}
              data-testid={`${channel.id}-dm-link-text`}
            >
              {channel.displayedName}
            </Typography>
            {userData != null && me != null && userData.user.userId === me.userId && (
              <Typography
                variant='body2'
                align='left'
                className={classNames(classes.nickname, classes.me)}
                data-testid={`${channel.id}-dm-link-text`}
              >
                me
              </Typography>
            )}
          </Grid>
        }
        classes={{
          primary: classes.primary,
        }}
        className={classes.itemText}
      />
    </StyledListItemButton>
  )
}

export default DirectMessageListItem
