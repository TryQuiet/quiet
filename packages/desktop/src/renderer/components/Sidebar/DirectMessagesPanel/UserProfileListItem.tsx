import React from 'react'
import { styled, useTheme } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, ListItemButton, Avatar } from '@mui/material'
import Badge from '@mui/material/Badge'
import ListItemText from '@mui/material/ListItemText'
import { UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { users } from '@quiet/state-manager'
import { useSelector } from 'react-redux'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'

const PREFIX = 'UserProfileListItem'

const classes = {
  root: `${PREFIX}root`,
  avatar: `${PREFIX}avatar`,
  primary: `${PREFIX}primary`,
  nickname: `${PREFIX}nickname`,
  itemText: `${PREFIX}itemText`,
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
    opacity: 0.7,
    fontWeight: 300,
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
}))

export interface UserProfileListItemProps {
  userProfile: UserProfile
  userProfileContextMenu: ReturnType<typeof useContextMenu>
  connected?: boolean
}

export const UserProfileListItem: React.FC<UserProfileListItemProps> = ({
  userProfile,
  userProfileContextMenu,
  connected = false,
}) => {
  const theme = useTheme()

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    userProfileContextMenu.handleOpen({ userProfile })
  }

  return (
    <StyledListItemButton
      className={classNames(classes.root)}
      disableGutters
      data-testid={`${userProfile.nickname}-user-link`}
      tabIndex={-1}
      onClick={handleOpenMenu}
    >
      <StyledBadge
        slotProps={{ badge: { 'data-testid': `${userProfile.nickname}-user-link-status-badge` } as any }}
        overlap='circular'
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant='dot'
        invisible={!connected}
      >
        <span className={classes.avatar}>
          <ProfilePhoto
            userProfile={userProfile}
            userId={userProfile.userId}
            size={theme.componentSizes.avatar.small}
          />
        </span>
      </StyledBadge>
      <ListItemText
        primary={
          <Typography
            variant='body2'
            className={classes.nickname}
            data-testid={`${userProfile.nickname}-user-link-text`}
          >
            {userProfile.nickname}
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

export default UserProfileListItem
