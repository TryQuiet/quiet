import React from 'react'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { Typography, Grid } from '@material-ui/core'

import ZcashIcon from '../../ui/ZcashIcon'
import { messageType } from '../../../zbay/messages'
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
    paddingRight: 16
  },
  newMessages: {
    opacity: 1
  },
  icon: {
    marginTop: 6,
    fill: theme.palette.colors.green
  },
  itemText: {
    margin: 0
  },
  nameSpacing: {
    marginLeft: 4
  }
})

export const ChannelsListItem = ({ classes, channel, history, directMessages, selected }) => {
  const channelObj = channel.toJS()
  const size = 15
  const highlight = directMessages
    ? selected.targetRecipientAddress === channel.address
    : channelObj.address === selected.address
  const newMessages = directMessages ? channelObj.newMessages.length : channelObj.unread
  const recievedMoney =
    directMessages &&
    channelObj.messages.find(
      msg => msg.type === messageType.TRANSFER && channelObj.newMessages.includes(msg.id)
    )
  return (
    <ListItem
      button
      disableGutters
      onClick={() => {
        history.push(
          `/main/${
            directMessages
              ? `direct-messages/${channelObj.address}/${channelObj.username}`
              : `channel/${channelObj.id}`
          }`
        )
      }}
      className={classNames(classes.root, {
        [classes.selected]: highlight
      })}
    >
      <ListItemText
        primary={
          <Grid container alignItems='center'>
            <Grid item>
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  [classes.newMessages]: newMessages
                })}
              >
                {directMessages ? (
                  `@ ${channelObj.username}`
                ) : (
                  <Grid container direction='row'>
                    <Grid item>
                      <span>{'#'}</span>
                    </Grid>
                    <Grid item xs className={classes.nameSpacing}>
                      <span>{`${channelObj.name}`}</span>
                    </Grid>
                  </Grid>
                )}
              </Typography>
            </Grid>
            {recievedMoney && (
              <Grid item>
                <ZcashIcon size={size} className={classes.icon} />
              </Grid>
            )}
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
  channel: PropTypes.oneOfType([
    PropTypes.instanceOf(Immutable.Map),
    PropTypes.instanceOf(Immutable.Record)
  ]).isRequired,
  selected: PropTypes.instanceOf(Immutable.Record).isRequired,
  directMessages: PropTypes.bool,
  history: PropTypes.object.isRequired
}

ChannelsListItem.defaultProps = {
  directMessages: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelsListItem)
