import React, { useRef } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, Grid, ListItemButton, createSvgIcon } from '@mui/material'
import ListItemText from '@mui/material/ListItemText'
import { PublicChannel } from '@quiet/types'
import inlineSvg from 'react-inlinesvg'
import lockIconSvg from '../../../static/images/lock-filled.svg'
import hashIconSvg from '../../../static/images/hash.svg'

const PREFIX = 'ChannelsListItem'

const classes = {
  root: `${PREFIX}root`,
  selected: `${PREFIX}selected`,
  primary: `${PREFIX}primary`,
  title: `${PREFIX}title`,
  newMessages: `${PREFIX}newMessages`,
  connectedIcon: `${PREFIX}connectedIcon`,
  notConnectedIcon: `${PREFIX}notConnectedIcon`,
  itemText: `${PREFIX}itemText`,
  disabled: `${PREFIX}disabled`,
  channelIcon: `${PREFIX}channelIcon`,
  channelIconNewMessages: `${PREFIX}channelIconNewMessages`,
}

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: 220,
    height: 'hug',
    padding: '3px 16px',
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

  [`& .${classes.newMessages}`]: {
    opacity: 1,
    fontWeight: 600,
  },

  [`& .${classes.channelIcon}`]: {
    opacity: 0.5,
    fontSize: 12,
    width: 12,
    height: 12,
  },

  [`& .${classes.channelIconNewMessages}`]: {
    opacity: 1,
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
  channel: PublicChannel
  unread: boolean
  selected: boolean
  setCurrentChannel: (name: string) => void
  disabled: boolean
}

export const ChannelsListItem: React.FC<ChannelsListItemProps> = ({
  channel,
  unread,
  selected,
  setCurrentChannel,
  disabled = false,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const LockIcon = createSvgIcon(inlineSvg({ src: lockIconSvg }) as React.ReactElement, 'Lock')
  const HashIcon = createSvgIcon(inlineSvg({ src: hashIconSvg }) as React.ReactElement, 'Hash')
  const Icon = channel.public ? HashIcon : LockIcon
  const iconTestId = channel.public
    ? `${channel.name}-channel-link-public-hash`
    : `${channel.name}-channel-link-private-lock`

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
            <Grid container alignItems='center' direction='row' gap='4px' display='flex'>
              <Icon
                viewBox='0 0 12 12'
                className={classNames(classes.channelIcon, {
                  [classes.channelIconNewMessages]: unread,
                })}
                data-testid={iconTestId}
              />
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  [classes.newMessages]: unread,
                })}
                data-testid={`${channel.name}-channel-link-text`}
              >
                {channel.name}
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
