import React, { useRef } from 'react'
import { styled, useTheme } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, ListItemButton, Grid } from '@mui/material'
import Badge from '@mui/material/Badge'
import ListItemText from '@mui/material/ListItemText'
import { PublicChannelStorage, UserProfile } from '@quiet/types'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import { DmChannelUserData } from './DirectMessagesPanel'
import ProfilePhotoWithBadge from '../../ProfilePhoto/ProfilePhotoWithBadge'

const PREFIX = 'UserProfileListItem'

const classes = {
  root: `${PREFIX}root`,
  primary: `${PREFIX}primary`,
  nickname: `${PREFIX}nickname`,
  itemText: `${PREFIX}itemText`,
  selected: `${PREFIX}selected`,
  disabled: `${PREFIX}disabled`,
  newMessages: `${PREFIX}newMessages`,
  me: `${PREFIX}me`,
}

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
  /**
   * Which of these conversations is with yourself — an annotation, not a second name, so it is
   * smaller and quieter than the nickname rather than the same size merely greyed.
   *
   * On the purple sidebar a mid grey has too little contrast, and less still on a selected row,
   * which is that purple lightened. White at 60% keeps the same relationship to the text beside it
   * against every state the row has.
   */
  [`& .${classes.me}`]: {
    fontSize: 12,
    lineHeight: '16px',
    letterSpacing: '0.4px',
    color: 'rgba(255, 255, 255, 0.6)',
    flexShrink: 0,
  },

  [`&.${classes.root}:hover`]: {
    backgroundColor: theme.palette.colors.sidebarHover,
  },
}))

export interface DirectMessageListItemProps {
  channel: PublicChannelStorage
  me: UserProfile | undefined
  userProfiles: Record<string, UserProfile>
  userData: DmChannelUserData | undefined
  selected: boolean
  unread: boolean
  setCurrentChannel: (channelId: string) => void
}

export const DirectMessageListItem: React.FC<DirectMessageListItemProps> = ({
  channel,
  me,
  userProfiles,
  userData,
  selected,
  unread,
  setCurrentChannel,
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
      data-testid={`${channel.id}-dm-link`}
      tabIndex={-1}
      onClick={() => {
        setCurrentChannel(channel.id)
      }}
      ref={ref}
    >
      <ProfilePhotoWithBadge userData={userData} channel={channel} />
      <ListItemText
        primary={
          <Grid container item display='flex' flexDirection='row' alignItems='baseline' gap='6px'>
            <Typography
              variant='body2'
              className={classNames(classes.nickname, {
                [classes.newMessages]: unread,
              })}
              data-testid={`${channel.id}-dm-link-text`}
            >
              {channel.displayedName}
            </Typography>
            {userData != null && me != null && userData.user.userId === me.userId && (
              <Typography align='left' className={classes.me} data-testid={`dm-link-text-me`}>
                you
              </Typography>
            )}
          </Grid>
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
