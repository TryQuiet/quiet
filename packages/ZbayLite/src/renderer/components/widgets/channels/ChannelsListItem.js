import React from 'react'
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

export const ChannelsListItem = ({ classes, channel, displayAddress }) => (
  <ListItem
    button
    className={classes.root}
    alignItems={displayAddress ? 'flex-start' : 'center'}
  >
    <ListItemIcon className={classes.itemIcon}>
      {channel.private ? <HttpsIcon /> : <ChatBubbleOutlineIcon className={classes.icon} />}
    </ListItemIcon>
    <ListItemText
      primary={
        <Badge
          badgeContent={channel.unread}
          classes={{
            badge: classes.badge
          }}
        >
          {channel.name}
        </Badge>
      }
      secondary={
        displayAddress
          ? <Elipsis tooltipPlacement='bottom' content={channel.address} length={30} />
          : ''
      }
      className={classes.itemText}
      secondaryTypographyProps={{ variant: 'caption' }}
      address={channel.address}
    />
  </ListItem>
)

ChannelsListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  channel: PropTypes.shape({
    name: PropTypes.string.isRequired,
    private: PropTypes.bool.isRequired,
    hash: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    unread: PropTypes.number,
    description: PropTypes.string
  }).isRequired,
  displayAddress: PropTypes.bool
}

ChannelsListItem.defaultProps = {
  displayAddress: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelsListItem)
