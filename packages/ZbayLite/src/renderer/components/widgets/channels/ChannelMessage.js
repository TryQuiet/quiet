import React from 'react'
import PropTypes from 'prop-types'
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
  const username = R.propOr('Unnamed', 'username')(message)
  const address = getZbayAddress(message.address)
  const time = DateTime.fromISO(message.createdAt)
  const timeFormat = getTimeFormat(time)
  const timeString = time.toFormat(timeFormat)
  console.log(message.createdAt, timeString)
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
            {message.description}
          </Typography>
        }
      />
    </ListItem>
  )
}

ChannelMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.shape({
    createdAt: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    username: PropTypes.string
  }).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelMessage)
