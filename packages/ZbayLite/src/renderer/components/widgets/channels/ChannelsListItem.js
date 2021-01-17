import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { Typography, Grid } from '@material-ui/core'

// import ZcashIcon from '../../ui/ZcashIcon'
import Icon from '../../ui/Icon'
import onlineIcon from '../../../static/images/online.svg'
import offlineIcon from '../../../static/images/offline.svg'
// import { unknownUserId } from '../../../../shared/static'

const styles = theme => ({
  root: {
    padding: 0
  },
  selected: {
    backgroundColor: theme.palette.colors.lushSky,
    '&:hover': {
      backgroundColor: theme.palette.colors.lushSky
    }
  },
  badge: {
    padding: 6,
    top: '50%',
    right: theme.spacing(-3),
    fontSize: 10,
    background: 'rgb(0,0,0,0.3)',
    color: '#fff'
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
  icon: {
    marginTop: 6,
    fill: theme.palette.colors.green
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
  },
  nameSpacing: {
    marginLeft: 4
  }
})

export const ChannelsListItem = ({
  classes,
  channel,
  history,
  directMessages,
  selected,
  fetchAllMessages
}) => {
  const isFromZbay = channel.username !== 'Unknown'
  // const size = 15
  const highlight = selected.id === channel.key
  // const recievedMoney =
  //   directMessages &&
  //   channelObj.messages.find(
  //     msg => msg.type === messageType.TRANSFER && channelObj.newMessages.includes(msg.id)
  //   )
  return (
    <ListItem
      button
      disableGutters
      onClick={() => {
        fetchAllMessages(channel.address)
        history.push(
          `/main/${
            directMessages
              ? `direct-messages/${channel.key}/${channel.username}`
              : `channel/${channel.key}`
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
              {directMessages && (
                <Icon
                  className={channel?.connected ? classes.connectedIcon : classes.notConnectedIcon}
                  src={channel?.connected ? onlineIcon : offlineIcon}
                />
              )}
            </Grid>
            <Grid item>
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  [classes.newMessages]: channel.newMessages.length > 0
                })}>
                {directMessages
                  ? `${
                      isFromZbay
                        ? `${channel.username || channel.address.substring(0, 8)}`
                        : 'unknown'
                    }`
                  : `# ${channel.username}`}
              </Typography>
            </Grid>
            {/* {recievedMoney && (
              <Grid item>
                <ZcashIcon size={size} className={classes.icon} />
              </Grid>
            )} */}
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
ChannelsListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.object.isRequired,
  selected: PropTypes.object.isRequired,
  directMessages: PropTypes.bool,
  history: PropTypes.object.isRequired,
  isRegisteredUsername: PropTypes.bool
}

ChannelsListItem.defaultProps = {
  directMessages: false
}

export default R.compose(React.memo, withStyles(styles))(ChannelsListItem)
