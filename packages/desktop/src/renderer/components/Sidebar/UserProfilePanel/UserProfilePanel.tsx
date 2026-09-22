import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { Identity, UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../hooks/useContextMenu'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import { sidebarMetrics } from '../../ui/Sidebar/sidebarMetrics'

const PREFIX = 'UserProfilePanel-'

const classes = {
  root: `${PREFIX}root`,
  button: `${PREFIX}button`,
  profilePhoto: `${PREFIX}profilePhoto`,
  nickname: `${PREFIX}nickname`,
}

const StyledUserProfilePanel = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%',
    // The library separates the profile summary from the scrolling list with a
    // hairline rather than a change of colour.
    borderTop: `1px solid ${sidebarMetrics.profile.border}`,
    // `Profile summary` (`4716:7702`) sits at 90% in all three of its variants
    // and in the sidebar instance, which is what recesses your own row relative
    // to the members above it.
    opacity: sidebarMetrics.profile.opacity,
  },

  [`& .${classes.button}`]: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: sidebarMetrics.profile.height,
    padding: `${sidebarMetrics.profile.paddingY}px ${sidebarMetrics.profile.paddingX}px`,
    gap: sidebarMetrics.profile.gap,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: theme.palette.colors.white,
    transition: 'background-color 0.2s',
    // `Profile summary` Hover=True (`4716:7702`) carries a white 10% overlay,
    // not the 5% a list row gets. develop had moved this row onto the 5%
    // `sidebarHover` token for consistency with the list rows; the library
    // differentiates the two deliberately, so the summary keeps its own value.
    // develop's other concern there — that a rounded MUI Button turned the
    // hover into a floating pill among full-bleed rows — is met by construction
    // here: this is a plain button with no radius, so the wash spans the column.
    '&:hover': {
      backgroundColor: sidebarMetrics.overlay.selected,
      [`& .${classes.nickname}`]: {
        opacity: sidebarMetrics.opacity.hover,
      },
    },
    '&:active': {
      backgroundColor: sidebarMetrics.overlay.pressed,
    },
  },

  [`& .${classes.profilePhoto}`]: {
    flexShrink: 0,
    display: 'block',
    width: sidebarMetrics.profile.avatar,
    height: sidebarMetrics.profile.avatar,
    borderRadius: sidebarMetrics.profile.avatarRadius,
    overflow: 'hidden',
  },

  [`& .${classes.nickname}`]: {
    minWidth: 0,
    opacity: sidebarMetrics.opacity.label,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.colors.white,
  },
}))

export interface UserProfilePanelProps {
  currentIdentity?: Identity
  userId: string
  userProfile?: UserProfile
  userProfileContextMenu: ReturnType<typeof useContextMenu>
}

/**
 * "Profile summary" from the Quiet Design Library's desktop sidebar
 * (`6218:16416`) — the signed-in user's avatar and name, pinned to the bottom of
 * the column. It opens the profile menu the app already has.
 */
export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({ userId, userProfile, userProfileContextMenu }) => {
  const username = userProfile?.nickname || ''
  return (
    <StyledUserProfilePanel className={classes.root}>
      <button
        type='button'
        className={classes.button}
        onClick={event => {
          event.persist()
          if (userProfile) {
            userProfileContextMenu.handleOpen({ userProfile })
          } else {
            userProfileContextMenu.handleOpen()
          }
        }}
        data-testid={'user-profile-menu-button'}
      >
        <span className={classes.profilePhoto}>
          <ProfilePhoto
            userProfile={userProfile}
            userId={userId}
            size={sidebarMetrics.profile.avatar}
            style={{ marginBottom: 0, borderRadius: sidebarMetrics.profile.avatarRadius }}
          />
        </span>
        <Typography variant='body2' className={classes.nickname} data-testid='user-profile-nickname'>
          {username}
        </Typography>
      </button>
    </StyledUserProfilePanel>
  )
}

export default UserProfilePanel
