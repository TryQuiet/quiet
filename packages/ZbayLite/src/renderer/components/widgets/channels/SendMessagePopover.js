import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Popover from '@material-ui/core/Popover'
import Jdenticon from 'react-jdenticon'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import ClearIcon from '@material-ui/icons/Clear'
import IconButton from '../../ui/IconButton'

const styles = theme => ({
  alignAvatarPopover: {
    marginTop: theme.spacing(2)
  },
  button: {
    marginTop: theme.spacing(1.2),
    width: 260,
    height: 60,
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    paddingLeft: theme.spacing(1.6),
    paddingRight: theme.spacing(1.6),
    color: theme.palette.colors.white,
    fontSize: '0.9rem',
    backgroundColor: '#521c74',
    textTransform: 'none'
  },
  container: {
    height: 350,
    width: 288
  },
  usernamePopover: {
    fontSize: '1.2rem',
    fontWeight: '600',
    marginTop: -4
  },
  closeIcon: {
    margin: theme.spacing(2)
  }
})

export const SendMessagePopover = ({ classes, username, address, anchorEl, handleClose }) => {
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
      <Grid container className={classes.container} direction='column' justify='flex-start' alignItems='center'>
        <Grid className={classes.icon} container item direction='row' justify='flex-start'>
          <IconButton className={classes.closeIcon} onClick={handleClose}>
            <ClearIcon />
          </IconButton>
        </Grid>
        <Grid item>
          <span className={classes.alignAvatarPopover}>
            <Jdenticon size='100' value={username} />
          </span>
        </Grid>
        <Grid item={12}>
          <Typography color='textPrimary' className={classes.usernamePopover}>{username}</Typography>
        </Grid>
        <Grid item={12}>
          <Typography variant='caption'>{address.substring(0, 32)}...</Typography>
        </Grid>
        <Grid item={12}>
          <Button variant={'contained'} className={classes.button}>Send message</Button>
        </Grid>
      </Grid>
    </Popover>
  )
}

SendMessagePopover.propTypes = {
  classes: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
  address: PropTypes.string.isRequired,
  anchorEl: PropTypes.bool
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SendMessagePopover)
