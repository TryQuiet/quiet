import React from 'react'
import { styled, useTheme } from '@mui/material/styles'
import Badge from '@mui/material/Badge'
import { UserProfile } from '@quiet/types'
import { useContextMenu } from '../../../../hooks/useContextMenu'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import SidebarRow from '../../ui/Sidebar/SidebarRow'
import { sidebarMetrics } from '../../ui/Sidebar/sidebarMetrics'

const PREFIX = 'UserProfileListItem'

const classes = {
  avatar: `${PREFIX}avatar`,
}

/**
 * The library's people row has an "Online indicator" on the avatar. Quiet's
 * equivalent signal is whether we hold a connection to that member's peer, and
 * the ring the app already draws leaves exactly the library's 7px dot visible
 * (11px across, less a 2px ring in the column's own colour).
 */
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

  [`& .${classes.avatar}`]: {
    display: 'block',
    width: sidebarMetrics.peopleRow.avatar,
    height: sidebarMetrics.peopleRow.avatar,
    borderRadius: sidebarMetrics.peopleRow.avatarRadius,
    overflow: 'hidden',
    background: theme.palette.background.paper,
  },
}))

export interface UserProfileListItemProps {
  userProfile: UserProfile
  userProfileContextMenu: ReturnType<typeof useContextMenu>
  connected?: boolean
}

/**
 * One member in the sidebar's "Users" section — the Quiet Design Library's
 * `List item--people` (`4606:16448`, Type=Single).
 */
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
    <SidebarRow
      variant='people'
      label={userProfile.nickname}
      onClick={handleOpenMenu}
      tabIndex={-1}
      data-testid={`${userProfile.nickname}-user-link`}
      labelTestId={`${userProfile.nickname}-user-link-text`}
      glyph={
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
              style={{ marginBottom: 0, borderRadius: sidebarMetrics.peopleRow.avatarRadius }}
            />
          </span>
        </StyledBadge>
      }
    />
  )
}

export default UserProfileListItem
