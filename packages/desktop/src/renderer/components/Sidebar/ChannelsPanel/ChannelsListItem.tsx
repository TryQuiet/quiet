import React, { useEffect, useRef } from 'react'
import classNames from 'classnames'
import { Typography, Grid } from '@mui/material'
import { makeStyles } from '@mui/material/styles'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { PublicChannel } from '@quiet/state-manager'

const useStyles = makeStyles(theme => ({
  root: {
    padding: 0
  },
  selected: {
    backgroundColor: theme.palette.colors.lushSky,
    '&:hover': {
      backgroundColor: theme.palette.colors.lushSky
    }
  },
  primary: {
    display: 'flex'
  },
  title: {
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
  newMessages: {
    opacity: 1,
    fontWeight: 600
  },
  connectedIcon: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11
  },
  notConnectedIcon: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11,
    opacity: 0.5
  },
  itemText: {
    margin: 0
  }
}))

export interface ChannelsListItemProps {
  channel: PublicChannel
  unread: boolean
  selected: boolean
  focused: boolean
  setCurrentChannel: (name: string) => void
}

export const ChannelsListItem: React.FC<ChannelsListItemProps> = ({
  channel,
  unread,
  selected,
  focused,
  setCurrentChannel
}) => {
  const classes = useStyles({})

  const ref = useRef<HTMLDivElement>()

  useEffect(() => {
    if (focused) {
      ref.current.focus()
    }
  }, [focused])

  return (
    <ListItem
      ref={ref}
      button
      disableGutters
      onClick={() => {
        setCurrentChannel(channel.name)
      }}
      className={classNames(classes.root, {
        [classes.selected]: selected
      })}
      data-testid={`${channel.name}-link`}
    >
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
    </ListItem>
  )
}

export default ChannelsListItem
