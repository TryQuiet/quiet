import React from 'react'
import { styled } from '@mui/material/styles'
import { Button } from '@mui/material'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { Identity, UserProfile } from '@quiet/types'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import Jdenticon from '../../Jdenticon/Jdenticon'

const PREFIX = 'UserProfilePanel'

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
  borderTop: '1px solid rgba(255, 255, 255, 0.10)',
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 12,
  paddingBottom: 12,

  [`& .${classes.button}`]: {
    color: theme.palette.colors.white,
    padding: 0,
    textAlign: 'left',
    opacity: 0.7,
    textTransform: 'lowercase',
    '&:hover': {
      opacity: 1,
      backgroundColor: 'inherit',
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
}))

export interface UserProfilePanelProps {
  currentIdentity?: Identity
  userProfile?: UserProfile
  userProfileContextMenu: ReturnType<typeof useContextMenu>
}

export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({
  currentIdentity,
  userProfile,
  userProfileContextMenu,
}) => {
  const username = currentIdentity?.nickname || ''
  return (
    <UserProfilePanelButtonStyled>
      <Button
        onClick={event => {
          event.persist()
          userProfileContextMenu.handleOpen()
        }}
        component='div'
        classes={{ root: classes.button }}
        data-testid={'settings-panel-button'}
      >
        {userProfile?.profile.photo ? (
          <img className={classes.profilePhoto} src={userProfile?.profile.photo} alt={'Your user profile image'} />
        ) : (
          <Jdenticon
            value={username}
            size='24'
            style={{
              width: '24px',
              height: '24px',
              background: '#F3F0F6',
              borderRadius: '4px',
              marginRight: '8px',
            }}
          />
        )}
        <Typography variant='body2' className={classes.nickname}>
          {username}
        </Typography>
      </Button>
    </UserProfilePanelButtonStyled>
  )
}

export default UserProfilePanel
