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
  buttonContainer: `${PREFIX}buttonContainer`,
}

const UserProfilePanelButtonStyled = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(1),
  borderTop: '1px solid rgba(255, 255, 255, 0.10)',

  [`& .${classes.button}`]: {
    color: theme.palette.colors.white,
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'flex-start',
    transition: 'background-color 0.2s, opacity 0.2s',
    width: '100%',
    textAlign: 'left',
    opacity: 0.7,
    textTransform: 'lowercase',
    backgroundColor: 'inherit',
    '&:hover': {
      opacity: 1,
      backgroundColor: theme.palette.action.hover,
    },
  },

  [`& .${classes.profilePhoto}`]: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    marginRight: '8px',
  },

  [`& .${classes.nickname}`]: {
    fontWeight: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 215,
    whiteSpace: 'nowrap',
  },

  [`& .${classes.buttonContainer}`]: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    gap: 8,
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
  userId,
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
        <Grid container className={classes.buttonContainer}>
          <ProfilePhoto
            userProfile={userProfile}
            userId={userId}
            className={classes.profilePhoto}
            size={theme.componentSizes.avatar.small}
          />
          <Typography variant='body2' className={classes.nickname} data-testid='user-profile-nickname'>
            {username}
          </Typography>
        </Grid>
      </Button>
    </UserProfilePanelButtonStyled>
  )
}

export default UserProfilePanel
