import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'
import { DateTime } from 'luxon'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'
import { Button } from '@material-ui/core'

import zbayLogo from '../../../../static/images/zcash/zbay-square-logo.svg'
import Icon from '../../../ui/Icon'
import { getTimeFormat, transformToLowercase } from '../BasicMessage'

const styles = theme => ({
  messageCard: {
    padding: 0
  },
  wrapper: {
    backgroundColor: theme.palette.colors.gray03
  },

  username: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: -4,
    marginRight: 5
  },
  avatar: {
    marginRight: 10
  },
  message: {
    marginTop: 14,
    marginLeft: -4,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word'
  },
  messageInput: {
    marginTop: -35,
    marginLeft: 50
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 4
  },
  visibleInfo: {
    lineHeight: '18px',
    letterSpacing: 0.4,
    color: theme.palette.colors.black30,
    marginBottom: 3,
    fontSize: 12
  },
  highlight: {
    color: theme.palette.colors.lushSky,
    backgroundColor: theme.palette.colors.lushSky12,
    padding: 5,
    borderRadius: 4
  },
  button: {
    minWidth: 87,
    height: 24,
    fontSize: 11,
    lineHeight: '13px',
    textTransform: 'none',
    padding: 0,
    fontWeight: 'normal',
    color: theme.palette.colors.trueBlack,
    borderColor: theme.palette.colors.trueBlack
  },
  buttonsDiv: {
    marginTop: 8
  },
  time: {
    color: theme.palette.colors.lightGray,
    fontSize: 14,
    marginTop: -4,
    marginRight: 5
  }
})

export const InviteMentionInfo = ({
  classes,
  nickname,
  handleInvite,
  handleClose,
  timeStamp
}) => {
  const username = 'Zbay'
  const time = DateTime.fromSeconds(timeStamp)
  const timeFormat = getTimeFormat(time)
  const timeString = transformToLowercase(time.toFormat(timeFormat))
  return (
    <ListItem
      className={classNames({
        [classes.wrapper]: true
      })}
    >
      <ListItemText
        disableTypography
        className={classes.messageCard}
        primary={
          <>
            <Typography variant='body2' className={classes.visibleInfo}>
              {`Only visible to you`}
            </Typography>
            <Grid
              container
              direction='row'
              justify='flex-start'
              alignItems='flex-start'
              wrap={'nowrap'}
            >
              <Grid item className={classes.avatar}>
                <Icon className={classes.icon} src={zbayLogo} />
              </Grid>
              <Grid container item direction='row' justify='space-between'>
                <Grid container item xs alignItems='flex-start' wrap='nowrap'>
                  <Grid item>
                    <Typography
                      color='textPrimary'
                      className={classes.username}
                    >
                      {username}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography className={classes.time}>
                      {timeString}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </>
        }
        secondary={
          <Grid container direction='column' className={classes.messageInput}>
            <Grid item>
              <Typography variant='body2' className={classes.message}>
                You mentioned{' '}
                {<span className={classes.highlight}>@{nickname}</span>}, but
                they're not a participant in this channel.
              </Typography>
            </Grid>
            <Grid item className={classes.buttonsDiv}>
              <Grid container spacing={1}>
                <Grid item>
                  <Button
                    className={classes.button}
                    variant='outlined'
                    onClick={handleInvite}
                  >
                    Invite {nickname}
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    className={classes.button}
                    variant='outlined'
                    onClick={handleClose}
                  >
                    Do Nothing
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        }
      />
    </ListItem>
  )
}

InviteMentionInfo.propTypes = {
  classes: PropTypes.object.isRequired,
  nickname: PropTypes.string.isRequired,
  handleInvite: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  timeStamp: PropTypes.number.isRequired
}
export default R.compose(React.memo, withStyles(styles))(InviteMentionInfo)
