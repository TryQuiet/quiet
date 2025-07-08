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
    backgroundColor: '#4caf50',
    color: '#4caf50',
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '1.5px solid white',
    boxSizing: 'border-box',
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
    width: 28,
    height: 28,
    marginRight: 12,
    fontSize: 16,
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
  user: UserProfile
  connected?: boolean
}

export const UserProfileListItem: React.FC<UserProfileListItemProps> = ({ user, connected = false }) => {
  const userProfileContextMenu = useContextMenu(MenuName.UserProfile)

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    userProfileContextMenu.handleOpen({ userProfile: user })
  }

  return (
    <StyledListItemButton
      className={classNames(classes.root)}
      disableGutters
      data-testid={`${user.nickname}-user-link`}
      tabIndex={-1}
      onClick={handleOpenMenu}
    >
      <StyledBadge
        overlap='circular'
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant='dot'
        invisible={!connected}
      >
        {user.photo ? (
          <Avatar className={classes.avatar} src={user.photo} alt={user.nickname} />
        ) : (
          <span className={classes.avatar}>
            <Jdenticon value={user.userId} size='28' style={{ width: 28, height: 28, borderRadius: 4 }} />
          </span>
        )}
      </StyledBadge>
      <ListItemText
        primary={
          <Typography variant='body2' className={classes.nickname} data-testid={`${user.nickname}-user-link-text`}>
            {user.nickname}
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
