import React from 'react'
import PropTypes from 'prop-types'
import { DateTime } from 'luxon'
import classNames from 'classnames'
import * as R from 'ramda'
import Jdenticon from 'react-jdenticon'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import CircularProgress from '@material-ui/core/CircularProgress'
import { withStyles } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'
import lightGreen from '@material-ui/core/colors/lightGreen'

import DoneIcon from '@material-ui/icons/Done'
import DoneAllIcon from '@material-ui/icons/DoneAll'
import ErrorIcon from '@material-ui/icons/ErrorOutline'
import BlockIcon from '@material-ui/icons/Block'

import { getZbayAddress } from '../../../zbay/channels'
import { _DisplayableMessage } from '../../../zbay/messages'
import Elipsis from '../../ui/Elipsis'

const styles = theme => ({
  messageCard: {
    padding: 0
  },
  wrapper: {
    background: '#fff',
    marginBottom: theme.spacing(1)
  },
  clickable: {
    cursor: 'pointer'
  },
  wrapperPending: {
    background: '#eeeeee'
  },
  username: {
    fontSize: '0.855rem',
    marginTop: -4
  },
  message: {
    fontSize: '0.855rem',
    marginTop: theme.spacing(1),
    whiteSpace: 'pre-line'
  },
  statusIcon: {
    color: theme.typography.caption.color,
    fontSize: '0.95rem',
    marginLeft: theme.spacing(1)
  },
  broadcasted: {
    color: lightGreen[600]
  },
  failed: {
    color: red[500]
  },
  avatar: {
    maxHeight: 44,
    maxWidth: 44,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 4
  },
  alignAvatar: {
    marginTop: 4
  }
})

const statusComponent = {
  broadcasted: DoneAllIcon,
  pending: props => <CircularProgress size={12} {...props} />,
  success: DoneIcon,
  failed: ErrorIcon,
  cancelled: BlockIcon
}

const getTimeFormat = time => {
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

export const BasicMessage = ({ classes, message, children, actionsOpen, setActionsOpen }) => {
  const fromYou = message.fromYou || false
  const sender = message.sender
  const username = sender.username.substring(0, 20) || 'Unnamed'
  const address = getZbayAddress(message.sender.replyTo)
  const time = DateTime.fromSeconds(message.createdAt)
  const timeFormat = getTimeFormat(time)
  const timeString = time.toFormat(timeFormat)

  const status = message.status || 'broadcasted'
  const StatusIcon = statusComponent[status]
  const error = message.error
  return (
    <ListItem
      className={classNames({
        [classes.wrapper]: true,
        [classes.clickable]: ['failed', 'cancelled'].includes(status),
        [classes.wrapperPending]: status !== 'broadcasted'
      })}
      alignItems='flex-start'
      onClick={() => setActionsOpen(!actionsOpen)}
    >
      <ListItemText
        disableTypography
        className={classes.messageCard}
        primary={
          <Grid container direction='row' justify='space-between' alignItems='flex-start'>
            <Grid item>
              <Grid container alignItems='center'>
                <Grid item xs='auto' alignItems='center' className={classes.avatar}>
                  <span className={classes.alignAvatar}>
                    <Jdenticon size='55' value={username} />
                  </span>
                </Grid>
                <Grid item xs='auto'>
                  <Typography color='textPrimary' className={classes.username}>
                    {username}
                    {fromYou ? ' (You)' : null}
                  </Typography>
                  <Typography variant='caption'>{address.substring(0, 32)}...</Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Grid container direction='row' alignItems='center' justify='flex-end'>
                <Typography variant='caption'>{timeString}</Typography>
                <StatusIcon
                  className={classNames({
                    [classes.statusIcon]: true,
                    [classes.failed]: status === 'failed',
                    [classes.broadcasted]: status === 'broadcasted'
                  })}
                />
              </Grid>
              {status === 'failed' ? (
                <Elipsis
                  interactive
                  content={`Error ${error.code}: ${error.message}`}
                  tooltipPlacement='bottom'
                  length={60}
                  classes={{ content: classes.failed }}
                />
              ) : null}
            </Grid>
          </Grid>
        }
        secondary={children}
      />
    </ListItem>
  )
}

BasicMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.instanceOf(_DisplayableMessage).isRequired,
  children: PropTypes.node,
  setActionsOpen: PropTypes.func.isRequired,
  actionsOpen: PropTypes.bool.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(BasicMessage)
