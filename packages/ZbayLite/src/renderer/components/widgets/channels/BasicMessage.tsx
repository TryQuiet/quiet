import React from 'react'
import { DateTime } from 'luxon'
import classNames from 'classnames'
import Jdenticon from 'react-jdenticon'

import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { makeStyles, Theme } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'

import Icon from '../../ui/Icon'
import dotsIcon from '../../../static/images/zcash/dots-icon.svg'
import maskIcon from '../../../static/images/avatar-13-mask-light.svg'
import { IBasicMessageProps } from './BasicMessage.d'
import SendMessagePopover from '../../../containers/widgets/channels/SendMessagePopover'
import ModeratorActionsPopper from '../../../containers/widgets/channels/ModeratorActionsPopper'

const useStyles = makeStyles((theme: Theme) => ({
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
    minHeight: 36,
    minWidth: 36,
    marginRight: 10,
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.grayBackgroud
  },
  alignAvatar: {
    marginTop: 2,
    marginLeft: 2,
    width: 32,
    height: 32
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
}))

export const getTimeFormat = () => {
  return 't'
}

export const transformToLowercase = string => {
  const hasPM = string.search('PM')
  return hasPM !== -1 ? string.replace('PM', 'pm') : string.replace('AM', 'am')
}

export const BasicMessage: React.FC<IBasicMessageProps> = ({
  message,
  children,
  actionsOpen,
  setActionsOpen,
  allowModeration
}) => {
  const classes = useStyles({})
  const [open, setOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [hovered, setHovered] = React.useState(false)
  const [anchorModeration, setAnchorModeration] = React.useState(null)
  const handleClick = (event, isFromZbayUser) => {
    if (isFromZbayUser) {
      setAnchorEl(event.currentTarget)
    }
  }
  const handleClose = () => setAnchorEl(null)
  const sender = message.sender
  const isUnregistered = message.isUnregistered
  const username = sender.username.substring(0, 20) || 'unknown'
  const time = DateTime.fromSeconds(message.createdAt)
  const timeFormat = getTimeFormat()
  const timeString = transformToLowercase(time.toFormat(timeFormat))
  const status = message.status || 'broadcasted'
  const isFromZbayUser = username !== 'unknown'
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
        setOpen(false)
      }}>
      <ListItemText
        disableTypography
        className={classes.messageCard}
        primary={
          <Grid
            container
            direction='row'
            justify='flex-start'
            alignItems='flex-start'
            wrap={'nowrap'}>
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
              <div className={classes.alignAvatar}>
                {isFromZbayUser ? (
                  <Jdenticon size='32' value={username} />
                ) : (
                  <Icon src={maskIcon} />
                )}
              </div>
            </Grid>
            <Grid container item direction='row' justify='space-between'>
              <Grid
                container
                item
                xs
                alignItems='flex-start'
                wrap='nowrap'
                onClick={e => handleClick(e, isFromZbayUser)}>
                <Grid item>
                  <Typography color='textPrimary' className={classes.username}>
                    {username}
                  </Typography>
                </Grid>
                {status !== 'failed' && (
                  <Grid item>
                    <Typography className={classes.time}>{timeString}</Typography>
                  </Grid>
                )}
              </Grid>
              {hovered && allowModeration && (
                <ClickAwayListener
                  onClickAway={() => {
                    setOpen(false)
                  }}>
                  <Grid
                    item
                    className={classes.moderation}
                    onClick={e => {
                      setOpen(!open)
                      setAnchorModeration(e.currentTarget)
                    }}>
                    <Icon src={dotsIcon} />

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

export default BasicMessage
