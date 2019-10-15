import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'

import ClearIcon from '@material-ui/icons/Clear'
import Error from '@material-ui/icons/Error'
import DoneAll from '@material-ui/icons/DoneAll'
import Button from '@material-ui/core/Button'

import IconButton from '../IconButton'

const styles = theme => ({
  root: {
    minWidth: 300,
    height: 300
  },
  icon: {
    fontSize: 125,
    color: theme.palette.colors.green
  },
  iconError: {
    fontSize: 125,
    color: theme.palette.colors.red
  },
  font: {
    width: '100%'
  },
  closeIcon: {
    margin: theme.spacing(2)
  },
  button: {
    marginTop: theme.spacing(3),
    width: 140,
    height: 60,
    paddingTop: theme.spacing(1.2),
    paddingBottom: theme.spacing(1.2),
    paddingLeft: theme.spacing(1.6),
    paddingRight: theme.spacing(1.6),
    color: theme.palette.colors.white,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.purple,
    textTransform: 'none'
  }
})

export const ReceivedInvitationModal = ({ classes, open, handleClose, modalPayload }) => {
  return (
    <Grid container direction='column' justify='flex-start' alignItems='center'>
      <Grid className={classes.icon} container item direction='row' justify='flex-start'>
        <IconButton className={classes.closeIcon} onClick={handleClose}>
          <ClearIcon />
        </IconButton>
      </Grid>
      <Grid container item justify='flex-start' alignItems='center' direction='column' className={classes.root}>
        <Grid item>
          {modalPayload ? <Error className={classes.iconError} /> : <DoneAll className={classes.icon} />}
        </Grid>
        <Grid item>
          <Typography className={classes.font} variant='body'> {modalPayload ? 'Error, please try again' : 'Invitation accepted successfully'}</Typography>
        </Grid>
        <Grid item>
          <Grid item>
            <Button
              variant={'contained'}
              onClick={handleClose}
              className={classes.button}
            > Close modal
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

ReceivedInvitationModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

ReceivedInvitationModal.defaultProps = {
  open: false
}

export default R.compose(
  withStyles(styles)
)(
  React.memo(ReceivedInvitationModal, (before, after) => {
    return (after.modalPayload === null)
  })
)
