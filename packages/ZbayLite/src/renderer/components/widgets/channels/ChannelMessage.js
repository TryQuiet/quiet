import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'

import { getZbayAddress } from '../../utils'

const styles = theme => ({
  wrapper: {
    background: '#fff',
    marginBottom: theme.spacing.unit
  },
  username: {
    fontSize: '0.855rem'
  },
  message: {
    fontSize: '0.855rem',
    marginTop: theme.spacing.unit
  }
})

const getTimeFormat = (time) => {
  const today = DateTime.utc()
  if (time.hasSame(today, 'day')) {
    return 'T'
  } else if (time.hasSame(today, 'week')) {
    return 'ccc, HH:mm'
  } else if (time.hasSame(today, 'year')) {
    return 'LLL dd, HH:mm'
  }
  return 'LLL dd, y, HH:mm'
}

export const ChannelMessage = ({ classes, message }) => {
  const sender = message.get('sender')
  const username = sender.get('username', 'Unnamed')
  const address = getZbayAddress(sender.get('replyTo'))

  const time = DateTime.fromSeconds(message.get('createdAt'))
  const timeFormat = getTimeFormat(time)
  const timeString = time.toFormat(timeFormat)
  return (
    <ListItem className={classes.wrapper} alignItems='flex-start'>
      <ListItemText
        primary={
          <Grid container direction='row' justify='space-between' alignItems='flex-start'>
            <Grid item>
              <Typography color='textPrimary' className={classes.username}>{username}</Typography>
              <Typography variant='caption'>{address.substring(0, 32)}...</Typography>
            </Grid>
            <Typography variant='caption'>{timeString}</Typography>
          </Grid>
        }
        secondary={
          <Typography variant='body2' className={classes.message}>
            {message.get('message')}
          </Typography>
        }
      />
    </ListItem>
  )
}

ChannelMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.instanceOf(Immutable.Map).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelMessage)
