import React from 'react'
import PropTypes from 'prop-types'
import { DateTime } from 'luxon'
import classNames from 'classnames'
import * as R from 'ramda'
import Jdenticon from 'react-jdenticon'

import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'

import DoneIcon from '@material-ui/icons/Done'
import DoneAllIcon from '@material-ui/icons/DoneAll'
import ErrorIcon from '@material-ui/icons/ErrorOutline'
import BlockIcon from '@material-ui/icons/Block'

import Icon from '../../ui/Icon'
import dotsIcon from '../../../static/images/zcash/dots-icon.svg'
import SendMessagePopover from '../../../containers/widgets/channels/SendMessagePopover'
import ModeratorActionsPopper from '../../../containers/widgets/channels/ModeratorActionsPopper'
import { _DisplayableMessage } from '../../../zbay/messages'
import Elipsis from '../../ui/Elipsis'

const styles = theme => ({
  messageCard: {
    padding: 0
  },
  wrapper: {
    backgroundColor: theme.palette.colors.white
  },
  clickable: {
    cursor: 'pointer'
  },
  wrapperPending: {
    background: theme.palette.colors.white
  },
  username: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: -4,
    marginRight: 5
  },
  message: {
    fontSize: '0.855rem',
    marginTop: theme.spacing(1),
    whiteSpace: 'pre-line'
  },
  statusIcon: {
    color: theme.palette.colors.lightGray,
    fontSize: 21,
    marginLeft: theme.spacing(1)
  },
  broadcasted: {
    color: theme.palette.colors.lightGray
  },
  failed: {
    color: red[500]
  },
  avatar: {
    maxHeight: 44,
    maxWidth: 44,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginBottom: 4
  },
  alignAvatar: {
    marginTop: 4
  },
  moderation: {
    cursor: 'pointer',
    marginRight: 10
  },
  time: {
    color: theme.palette.colors.lightGray,
    fontSize: 14,
    marginTop: -4,
    marginRight: 5
  },
  iconBox: {
    marginTop: -4
  }
})

const statusComponent = {
  broadcasted: DoneAllIcon,
  pending: DoneIcon,
  success: DoneIcon,
  failed: ErrorIcon,
  cancelled: BlockIcon
}

export const getTimeFormat = time => {
  const today = DateTime.utc()
  if (time.hasSame(today, 'day')) {
    return 't'
  } else if (time.hasSame(today, 'week')) {
    return 'ccc, t'
  } else if (time.hasSame(today, 'year')) {
    return 'LLL d, t'
  }
  return 'LLL d, y, t'
}

const transformToLowercase = string => {
  const hasPM = string.search('PM')
  return hasPM !== -1 ? string.replace('PM', 'pm') : string.replace('AM', 'am')
}

export const BasicMessage = ({
  classes,
  message,
  children,
  actionsOpen,
  setActionsOpen,
  allowModeration
}) => {
  const [open, setOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [hovered, setHovered] = React.useState(false)
  const [anchorModeration, setAnchorModeration] = React.useState(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const sender = message.sender
  const isUnregistered = message.isUnregistered
  const username = sender.username.substring(0, 20) || 'Unnamed'
  const time = DateTime.fromSeconds(message.createdAt)
  const timeFormat = getTimeFormat(time)
  const timeString = transformToLowercase(time.toFormat(timeFormat))
  const fromYou = message.fromYou
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
      onClick={() => setActionsOpen(!actionsOpen)}
      onMouseOver={() => {
        setHovered(true)
      }}
      onMouseLeave={() => {
        setHovered(false)
      }}
    >
      <ListItemText
        disableTypography
        className={classes.messageCard}
        primary={
          <Grid
            container
            direction='row'
            justify='flex-start'
            alignItems='flex-start'
            wrap={'nowrap'}
          >
            <SendMessagePopover
              username={username}
              address={message.sender.replyTo}
              publicKey={message.publicKey}
              txid={message.id}
              anchorEl={anchorEl}
              handleClose={handleClose}
              isUnregistered={isUnregistered}
            />
            <Grid item className={classes.avatar}>
              <span className={classes.alignAvatar}>
                <Jdenticon size='55' value={username} />
              </span>
            </Grid>
            <Grid container item direction='row' justify='space-between'>
              <Grid
                container
                item
                xs
                className={classes.pointer}
                alignItems='flex-start'
                wrap='nowrap'
                onClick={handleClick}
              >
                <Grid item>
                  <Typography color='textPrimary' className={classes.username}>
                    {username}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography className={classes.time}>{timeString}</Typography>
                </Grid>
                <Grid className={classes.iconBox} item>
                  {fromYou && (
                    <StatusIcon
                      className={classNames({
                        [classes.statusIcon]: true,
                        [classes.failed]: status === 'failed',
                        [classes.broadcasted]: status === 'broadcasted'
                      })}
                    />
                  )}
                  {status === 'failed' ? (
                    <Elipsis
                      interactive
                      content={`Error ${error.code}: ${error.message}`}
                      tooltipPlacement='top'
                      length={60}
                      classes={{ content: classes.failed }}
                    />
                  ) : null}
                </Grid>
              </Grid>
              {hovered && allowModeration && (
                <ClickAwayListener
                  onClickAway={() => {
                    setOpen(false)
                  }}
                >
                  <Grid
                    item
                    className={classes.moderation}
                    onClick={e => {
                      setOpen(!open)
                      setAnchorModeration(e.currentTarget)
                    }}
                  >
                    <Icon className={classes.user} src={dotsIcon} />

                    <ModeratorActionsPopper
                      address={message.sender.replyTo}
                      name={username}
                      open={open}
                      anchorEl={anchorModeration}
                      publicKey={message.publicKey}
                      txid={message.id}
                    />
                  </Grid>
                </ClickAwayListener>
              )}
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
  actionsOpen: PropTypes.bool.isRequired,
  allowModeration: PropTypes.bool.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(BasicMessage)
