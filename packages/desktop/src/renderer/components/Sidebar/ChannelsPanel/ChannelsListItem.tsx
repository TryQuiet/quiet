import React, { useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, Grid, ListItemButton, useTheme, createSvgIcon } from '@mui/material'
import ListItemText from '@mui/material/ListItemText'
import { Channel, UserProfile } from '@quiet/types'
import { useDispatch, useSelector } from 'react-redux'
import { publicChannels } from '@quiet/state-manager'
import inlineSvg from 'react-inlinesvg'
import lockIconSvg from '../../../static/images/lock.svg'

const PREFIX = 'ChannelsListItem'

const classes = {
  root: `${PREFIX}root`,
  selected: `${PREFIX}selected`,
  primary: `${PREFIX}primary`,
  title: `${PREFIX}title`,
  titlePublic: `${PREFIX}titlePublic`,
  newMessages: `${PREFIX}newMessages`,
  connectedIcon: `${PREFIX}connectedIcon`,
  notConnectedIcon: `${PREFIX}notConnectedIcon`,
  itemText: `${PREFIX}itemText`,
  disabled: `${PREFIX}disabled`,
  lock: `${PREFIX}lock`,
  lockNewMessages: `${PREFIX}lockNewMessages`,
}

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: 220,
    height: 'hug',
    padding: `3px 0px 3px 0px`,
    gap: 4,
    opacity: 1,
    display: 'flex',
    backgroundColor: 'inherit',
  },

  [`&.${classes.root}:hover`]: {
    backgroundColor: theme.palette.colors.sidebarHover,
  },

  [`&.${classes.selected}`]: {
    backgroundColor: theme.palette.colors.sidebarSelected,
  },

  [`& .${classes.primary}`]: {
    display: 'flex',
  },

  [`& .${classes.title}`]: {
    opacity: 0.7,
    fontWeight: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 215,
    whiteSpace: 'nowrap',
    textTransform: 'lowercase',
  },

  [`& .${classes.titlePublic}`]: {
    paddingLeft: 16,
    paddingRight: 2,
  },

  [`& .${classes.newMessages}`]: {
    opacity: 1,
    fontWeight: 600,
  },

  [`& .${classes.lock}`]: {
    opacity: 0.7,
    marginLeft: 13.5,
    marginRight: 0,
    fontWeight: 300,
    paddingRight: 2,
  },

  [`& .${classes.lockNewMessages}`]: {
    opacity: 1,
    fontWeight: 600,
  },

  [`& .${classes.connectedIcon}`]: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11,
  },

  [`& .${classes.notConnectedIcon}`]: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11,
    opacity: 0.5,
  },

  [`& .${classes.itemText}`]: {
    margin: 0,
  },
  [`&.${classes.disabled}`]: {
    opacity: '0.3',
    pointerEvents: 'none',
    cursor: 'not-allowed',
  },
}))

export interface ChannelsListItemProps {
  myUserProfile?: UserProfile
  channel: Channel
  unread: boolean
  selected: boolean
  setCurrentChannel: (name: string) => void
  disabled: boolean
}

export const ChannelsListItem: React.FC<ChannelsListItemProps> = ({
  myUserProfile,
  channel,
  unread,
  selected,
  setCurrentChannel,
  disabled = false,
}) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const headerTitle = channel.public ? `# ${channel.name}` : channel.name
  const LockIcon = createSvgIcon(inlineSvg({ src: lockIconSvg }) as React.ReactElement, 'Lock')

  return (
    <StyledListItemButton
      ref={ref}
      disableGutters
      onClick={() => {
        setCurrentChannel(channel.id)
      }}
      className={classNames(classes.root, {
        [classes.selected]: selected,
        [classes.disabled]: disabled,
      })}
      data-testid={`${channel.name}-link`}
    >
      <ListItemText
        primary={
          <Grid container alignItems='center'>
            <Grid container alignItems='center' direction='row' gap='1px' display='flex'>
              {!channel.public ? (
                <LockIcon
                  style={{ ...theme.typography.subtitle1 }}
                  className={classNames(classes.lock, {
                    [classes.lockNewMessages]: unread,
                  })}
                  data-testid={'channelTitle-private'}
                />
              ) : (
                <></>
              )}
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  [classes.newMessages]: unread,
                  [classes.titlePublic]: channel.public,
                })}
                data-testid={`${channel.name}-channel-link-text`}
              >
                {headerTitle}
              </Typography>
            </Grid>
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

export default ChannelsListItem
