import React from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, ListItemButton, Avatar } from '@mui/material'
import Badge from '@mui/material/Badge'
import ListItemText from '@mui/material/ListItemText'
import { UserProfile } from '@quiet/types'
import Jdenticon from '../../Jdenticon/Jdenticon'
import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { users } from '@quiet/state-manager'
import { useSelector } from 'react-redux'

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
    backgroundColor: '#9BD174',
    color: '#9BD174',
    width: 11,
    height: 11,
    minWidth: 11,
    minHeight: 11,
    borderRadius: '50%',
    border: `2px solid ${theme.palette.colors?.sidebarBackground || theme.palette.background.default}`,
    boxSizing: 'border-box',
    right: 0,
    bottom: 2,
    padding: 0,
  },
}))

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: 220,
    padding: `3px 16px 3px 16px`,
    gap: 8,
    opacity: 1,
    display: 'flex',
    backgroundColor: 'inherit',
    alignItems: 'center',
  },
  [`&:hover`]: {
    backgroundColor: theme.palette.colors?.sidebarHover || theme.palette.action.hover,
  },
  [`& .${classes.avatar}`]: {
    width: 24,
    height: 24,
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
        overlap='circular'
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant='dot'
        invisible={!connected}
      >
        {userProfile.photo ? (
          <Avatar className={classes.avatar} src={userProfile.photo} alt={userProfile.nickname} />
        ) : (
          <span className={classes.avatar}>
            <Jdenticon value={userProfile.userId} size='24' style={{ width: 24, height: 24, borderRadius: 4 }} />
          </span>
        )}
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
