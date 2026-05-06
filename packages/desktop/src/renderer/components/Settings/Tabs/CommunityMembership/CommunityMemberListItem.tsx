import React, { useRef } from 'react'
import { styled, useTheme } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, ListItemButton, Grid } from '@mui/material'
import Badge from '@mui/material/Badge'
import ListItemText from '@mui/material/ListItemText'
import { PublicChannelStorage, UserProfile } from '@quiet/types'
import ProfilePhotoWithBadge from '../../../ProfilePhoto/ProfilePhotoWithBadge'
import { DmChannelUserData } from '../../../Sidebar/DirectMessagesPanel/DirectMessagesPanel'
import { ProfilePhotoSize } from '../../../ProfilePhoto/ProfilePhoto.types'

const PREFIX = 'CommunityMemberListItem'

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
    gap: 8,
    opacity: 1,
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'inherit',
    alignItems: 'center',
    alignContent: 'center',
  },
  [`&:hover`]: {
    backgroundColor: theme.palette.colors?.sidebarHover || theme.palette.action.hover,
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

export interface CommunityMemberListItemProps {
  me: UserProfile | undefined
  userData: DmChannelUserData | undefined
  selected: boolean
  openUserProfile: (user: UserProfile) => void
}

export const CommunityMemberListItem: React.FC<CommunityMemberListItemProps> = ({
  me,
  userData,
  selected,
  openUserProfile,
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
      data-testid={`${userData?.user.userId}-membership-list-item`}
      tabIndex={-1}
      onClick={event => {
        event.persist()
        if (!userData) return
        openUserProfile(userData.user)
      }}
      ref={ref}
    >
      <ProfilePhotoWithBadge userData={userData} channel={undefined} size={ProfilePhotoSize.MEDIUM} />
      <ListItemText
        primary={
          <Grid container item display='flex' flexDirection='row' gap='8px'>
            <Typography
              variant='h4'
              className={classNames(classes.nickname)}
              data-testid={`${userData?.user.userId}-membership-list-name`}
            >
              {userData?.user.nickname ?? 'undefined'}
            </Typography>
            {me != null && userData?.user.userId === me.userId && (
              <Typography
                variant='h4'
                align='left'
                className={classNames(classes.nickname, classes.me)}
                data-testid={`membership-list-me`}
              >
                me
              </Typography>
            )}
          </Grid>
        }
        className={classNames(classes.itemText, classes.primary)}
      />
    </StyledListItemButton>
  )
}

export default CommunityMemberListItem
