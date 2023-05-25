import React, { useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, Grid, ListItemButton } from '@mui/material'
import ListItemText from '@mui/material/ListItemText'
import { PublicChannel } from '@quiet/state-manager'

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
  disabled: `${PREFIX}disabled`
}

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  [`&.${classes.root}`]: {
    padding: 0
  },

  [`&.${classes.selected}`]: {
    backgroundColor: theme.palette.colors.lushSky,
    '&:hover': {
      backgroundColor: theme.palette.colors.lushSky
    }
  },

  [`& .${classes.primary}`]: {
    display: 'flex'
  },

  [`& .${classes.title}`]: {
    opacity: 0.7,
    fontWeight: 300,
    paddingLeft: 16,
    paddingRight: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 215,
    whiteSpace: 'nowrap',
    textTransform: 'lowercase'
  },

  [`& .${classes.newMessages}`]: {
    opacity: 1,
    fontWeight: 600
  },

  [`& .${classes.connectedIcon}`]: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11
  },

  [`& .${classes.notConnectedIcon}`]: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11,
    opacity: 0.5
  },

  [`& .${classes.itemText}`]: {
    margin: 0
  },
  [`&.${classes.disabled}`]: {
    opacity: '0.3',
    pointerEvents: 'none',
    cursor: 'not-allowed'
  }
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
  disabled = false
}) => {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <StyledListItemButton
      ref={ref}
      disableGutters
      onClick={() => {
        setCurrentChannel(channel.id)
      }}
      className={classNames(classes.root, {
        [classes.selected]: selected,
        [classes.disabled]: disabled
      })}
      data-testid={`${channel.name}-link`}>
      <ListItemText
        primary={
          <Grid container alignItems='center'>
            <Grid item>
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  [classes.newMessages]: unread
                })}
                data-testid={`${channel.name}-link-text`}>
                {`# ${channel.name}`}
              </Typography>
            </Grid>
          </Grid>
        }
        classes={{
          primary: classes.primary
        }}
        className={classes.itemText}
      />
    </StyledListItemButton>
  )
}

export default ChannelsListItem
