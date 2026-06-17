import React from 'react'
import { styled } from '@mui/material/styles'
import { Button, useTheme } from '@mui/material'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { Identity, UserProfile } from '@quiet/types'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'

const PREFIX = 'UserProfilePanel-'

const classes = {
  root: `${PREFIX}root`,
  button: `${PREFIX}button`,
  profilePhoto: `${PREFIX}profilePhoto`,
  circleWrapper: `${PREFIX}circleWrapper`,
  circle: `${PREFIX}circle`,
  nickname: `${PREFIX}nickname`,
}

const UserProfilePanelButtonStyled = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(1),

  [`& .${classes.button}`]: {
    color: theme.palette.colors.white,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    transition: 'background-color 0.2s',
    width: '100%',
    textAlign: 'left',
    textTransform: 'lowercase',
    backgroundColor: 'inherit',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.10)',
    },
  },

  [`& .${classes.profilePhoto}`]: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    marginRight: '8px',
  },

  [`& .${classes.nickname}`]: {
    opacity: 0.7,
    fontWeight: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 215,
    whiteSpace: 'nowrap',
  },
}))

export interface UserProfilePanelProps {
  currentIdentity?: Identity
  userId: string
  userProfile?: UserProfile
  userProfileContextMenu: ReturnType<typeof useContextMenu>
}

export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({
  currentIdentity,
  userId: userID,
  userProfile,
  userProfileContextMenu,
}) => {
  const theme = useTheme()

  const username = userProfile?.nickname || ''
  return (
    <UserProfilePanelButtonStyled>
      <Button
        onClick={event => {
          event.persist()
          if (userProfile) {
            userProfileContextMenu.handleOpen({ userProfile })
          } else {
            userProfileContextMenu.handleOpen()
          }
        }}
        component='div'
        classes={{ root: classes.button }}
        data-testid={'user-profile-menu-button'}
      >
        <ProfilePhoto
          userProfile={userProfile}
          userId={userID}
          className={classes.profilePhoto}
          size={24}
          style={{
            marginRight: '8px',
            marginBottom: 0,
          }}
        />
        <Typography variant='body2' className={classes.nickname} data-testid='user-profile-nickname'>
          {username}
        </Typography>
      </Button>
    </UserProfilePanelButtonStyled>
  )
}

export default UserProfilePanel
