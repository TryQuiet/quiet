import React, { useRef } from 'react'
import { styled, useTheme } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, ListItemButton } from '@mui/material'
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
}

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.colors.statusGreen,
    color: theme.palette.colors.statusGreen,
    width: theme.componentSizes.statusIndicator.size,
    height: theme.componentSizes.statusIndicator.size,
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
}))

export interface DirectMessageListItemProps {
  channel: PublicChannelStorage
  me: UserProfile | undefined
  userProfiles: Record<string, UserProfile>
  userData: DmChannelUserData | undefined
  setCurrentChannel: (channelId: string) => void
}

export const DirectMessageListItem: React.FC<DirectMessageListItemProps> = ({
  channel,
  me,
  userProfiles,
  userData,
  setCurrentChannel,
}) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  return (
    <StyledListItemButton
      className={classNames(classes.root, {
        [classes.selected]: false,
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
      <StyledBadge
        slotProps={{ badge: { 'data-testid': `${channel.id}-dm-link-status-badge` } as any }}
        overlap='circular'
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant='dot'
        invisible={!userData?.connected}
      >
        {userData && (
          <span className={classes.avatar}>
            <ProfilePhoto
              userProfile={userData.user}
              userId={userData.user.userId}
              size={theme.componentSizes.avatar.small}
            />
          </span>
        )}
      </StyledBadge>
      <ListItemText
        primary={
          <Typography variant='body2' className={classes.nickname} data-testid={`${channel.id}-dm-link-text`}>
            {channel.displayedName}
          </Typography>
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
