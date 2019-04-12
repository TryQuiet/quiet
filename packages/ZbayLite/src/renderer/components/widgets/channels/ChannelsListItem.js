import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Badge from '@material-ui/core/Badge'

import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline'
import HttpsIcon from '@material-ui/icons/HttpsOutlined'

import Elipsis from '../../ui/Elipsis'

const styles = theme => ({
  root: {
    padding: '5px 16px 6px'
  },
  itemText: {
    paddingLeft: '12px'
  },
  itemIcon: {
    marginRight: 0
  },
  icon: {
    marginTop: '2px'
  },
  badge: {
    padding: 6,
    top: '50%',
    right: -3 * theme.spacing.unit,
    fontSize: 10,
    background: theme.typography.body1.color,
    color: '#fff'
  }
})

export const ChannelsListItem = ({ classes, channel, displayAddress, history }) => {
  const channelObj = channel.toJS()
  return (
    <ListItem
      button
      onClick={() => history.push(`/main/channel/${channelObj.id}`)}
      className={classes.root}
      alignItems={displayAddress ? 'flex-start' : 'center'}
    >
      <ListItemIcon className={classes.itemIcon}>
        {channelObj.private ? <HttpsIcon /> : <ChatBubbleOutlineIcon className={classes.icon} />}
      </ListItemIcon>
      <ListItemText
        primary={
          <Badge
            badgeContent={channelObj.unread}
            classes={{
              badge: classes.badge
            }}
          >
            {channelObj.name}
          </Badge>
        }
        secondary={
          displayAddress
            ? <Elipsis tooltipPlacement='bottom' content={channelObj.address} length={30} />
            : ''
        }
        className={classes.itemText}
        secondaryTypographyProps={{ variant: 'caption' }}
        address={channelObj.address}
      />
    </ListItem>
  )
}
ChannelsListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.instanceOf(Immutable.Map).isRequired,
  displayAddress: PropTypes.bool
}

ChannelsListItem.defaultProps = {
  displayAddress: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelsListItem)
