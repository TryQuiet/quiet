import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import Popover from '@material-ui/core/Popover'
import Jdenticon from 'react-jdenticon'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import ClearIcon from '@material-ui/icons/Clear'

import IconButton from '../../ui/IconButton'

const styles = theme => ({
  alignAvatarPopover: {
    marginTop: theme.spacing(0)
  },
  button: {
    width: 260,
    height: 60,
    marginTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(1.2),
    paddingLeft: theme.spacing(1.6),
    paddingRight: theme.spacing(1.6),
    color: theme.palette.colors.white,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.purple,
    textTransform: 'none'
  },
  container: {
    height: 400,
    width: 320
  },
  usernamePopover: {
    marginTop: theme.spacing(0),
    fontSize: '1.2rem',
    fontWeight: '600'
  },
  closeIcon: {
    margin: theme.spacing(0)
  },
  info: {
    color: theme.palette.colors.zbayBlue
  },
  infoDiv: {
    textAlign: 'center',
    marginTop: theme.spacing(0),
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4)
  },
  avatar: {
    marginTop: theme.spacing(0)
  }
})

export const SendMessagePopover = ({
  classes,
  username,
  address,
  anchorEl,
  handleClose,
  isUnregistered,
  identityId,
  createContact,
  history,
  removeMessage,
  banUser
}) => {
  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined
  return (
    <Popover
      className={classes.popover}
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
    >
      <Grid
        container
        className={classes.container}
        direction='column'
        justify='flex-start'
        alignItems='center'
      >
        <Grid className={classes.icon} container item direction='row' justify='flex-start'>
          <IconButton className={classes.closeIcon} onClick={handleClose}>
            <ClearIcon />
          </IconButton>
        </Grid>
        <Grid item className={classes.avatar}>
          <span className={classes.alignAvatarPopover}>
            <Jdenticon size='100' value={username} />
          </span>
        </Grid>
        <Grid item>
          <Typography color='textPrimary' className={classes.usernamePopover}>
            {username}
          </Typography>
        </Grid>
        <Grid item>
          <Typography className={classes.info} variant='caption'>
            {`${address.substring(0, 32)}...`}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant={'contained'}
            onClick={() =>
              createContact({
                contact: {
                  replyTo: address,
                  username
                },
                history
              })
            }
            disabled={
              !!(isUnregistered
                ? 'Sending direct messages is only available for registered users'
                : null)
            }
            className={classes.button}
          >
            Send message
          </Button>
        </Grid>
        <Grid item>
          <Button variant={'contained'} onClick={removeMessage} className={classes.button}>
            Remove message
          </Button>
        </Grid>
        <Grid item>
          <Button variant={'contained'} onClick={banUser} className={classes.button}>
            Block user
          </Button>
        </Grid>
        <Grid item className={classes.infoDiv}>
          <Typography className={classes.info} variant='caption'>
            {isUnregistered
              ? 'Sending direct messages is only available for registered users'
              : null}
          </Typography>
        </Grid>
      </Grid>
    </Popover>
  )
}

SendMessagePopover.propTypes = {
  classes: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  banUser: PropTypes.func.isRequired,
  removeMessage: PropTypes.func.isRequired,
  address: PropTypes.string.isRequired,
  anchorEl: PropTypes.bool,
  isUnregistered: PropTypes.bool
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SendMessagePopover)
