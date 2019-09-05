import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import Jdenticon from 'react-jdenticon'

import { withStyles } from '@material-ui/core/styles'

import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Badge from '@material-ui/core/Badge'

import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline'

import Elipsis from '../../ui/Elipsis'

const styles = theme => ({
  root: {
    padding: '5px 16px 6px'
  },
  itemText: {
    paddingLeft: '12px'
  },
  itemIcon: {
    marginRight: 0,
    minWidth: 0
  },
  icon: {
    marginTop: '2px',
    color: theme.palette.colors.white
  },
  badge: {
    padding: 6,
    top: '50%',
    right: theme.spacing(-3),
    fontSize: 10,
    background: 'rgb(0,0,0,0.3)',
    color: '#fff'
  },
  avatar: {
    maxHeight: 60,
    maxWidth: 60,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primary: {
    display: 'flex'
  },
  alignAvatar: {
    marginTop: 4
  }
})

export const ChannelsListItem = ({ classes, channel, displayAddress, history, directMessages }) => {
  const channelObj = channel.toJS()
  return (
    <ListItem
      button
      onClick={() => {
        history.push(
          `/main/${
            directMessages
              ? `direct-messages/${channelObj.address}/${channelObj.username}`
              : `channel/${channelObj.id}`
          }`
        )
      }}
      className={classes.root}
      alignItems={displayAddress ? 'flex-start' : 'center'}
    >
      <ListItemIcon className={classes.itemIcon}>
        {directMessages ? (
          <span className={classes.Avatar}>
            <span className={classes.alignAvatar}>
              <Jdenticon size='38' value={channelObj.username} />
            </span>
          </span>
        ) : (
          <ChatBubbleOutlineIcon className={classes.icon} />
        )}
      </ListItemIcon>
      <ListItemText
        primary={
          <Badge
            badgeContent={directMessages ? channelObj.newMessages.length : channelObj.unread}
            classes={{
              badge: classes.badge
            }}
          >
            {directMessages ? channelObj.username : channelObj.name}
          </Badge>
        }
        secondary={
          displayAddress ? (
            <Elipsis tooltipPlacement='bottom' content={channelObj.address} length={20} />
          ) : (
            ''
          )
        }
        classes={{
          primary: classes.primary
        }}
        className={classes.itemText}
        secondaryTypographyProps={{ variant: 'caption' }}
        address={channelObj.address}
      />
    </ListItem>
  )
}
ChannelsListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.oneOfType([
    PropTypes.instanceOf(Immutable.Map),
    PropTypes.instanceOf(Immutable.Record)
  ]).isRequired,
  displayAddress: PropTypes.bool,
  directMessages: PropTypes.bool
}

ChannelsListItem.defaultProps = {
  displayAddress: false,
  directMessages: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelsListItem)
