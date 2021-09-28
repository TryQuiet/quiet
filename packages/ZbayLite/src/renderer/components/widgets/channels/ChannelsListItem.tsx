import React from 'react'
import classNames from 'classnames'

import { makeStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { Typography, Grid } from '@material-ui/core'

import history from '../../../../shared/history'

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
    paddingLeft: 16,
    paddingRight: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 215,
    whiteSpace: 'nowrap',
    textTransform: 'lowercase'
  },
  newMessages: {
    opacity: 1
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

export interface IChannelsListItemComponentProps {
  channel: any
  directMessages: boolean
  selected: any
}

export const ChannelsListItem: React.FC<IChannelsListItemComponentProps> = ({
  channel,
  directMessages,
  selected
}) => {
  const classes = useStyles({})
  const highlight = selected === channel.address
  return (
    <ListItem
      button
      disableGutters
      onClick={() => {
        history.push(
          `/main/${directMessages
            ? `direct-messages/${channel.username}`
            : `channel/${channel.address}`
          }`
        )
      }}
      className={classNames(classes.root, {
        [classes.selected]: highlight
      })}>
      <ListItemText
        primary={
          <Grid container alignItems='center'>
            <Grid item>
              {/* {directMessages && (
                <Icon
                  className={channel?.connected ? classes.connectedIcon : classes.notConnectedIcon}
                  src={
                    isFromZbay
                      ? (channel?.connected ? onlineIcon : offlineIcon)
                      : avatarAnonMask
                  }
                />
              )} */}
            </Grid>
            <Grid item>
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  // TODO
                  [classes.newMessages]: false
                })}>
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
