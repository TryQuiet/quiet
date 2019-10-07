import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import { Typography } from '@material-ui/core'
import ClearIcon from '@material-ui/icons/Clear'

import IconButton from '../IconButton'

const styles = theme => ({
  root: {
    width: 600,
    height: 450,
    padding: theme.spacing(4)
  },
  closeIcon: {
    marginTop: -theme.spacing(2),
    marginLeft: -theme.spacing(2)
  },
  info: {
    marginTop: theme.spacing(2)
  },
  infoText: {
    width: 350
  },
  header: {
    marginTop: -theme.spacing(2)
  }
})

export const InvitationModal = ({ classes, open, handleClose, children, info, title }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <Grid
        container
        justify='flex-start'
        align='center'
        direction='column'
        className={classes.root}
      >
        <Grid className={classes.icon} container item direction='row' justify='flex-start'>
          <IconButton className={classes.closeIcon} onClick={handleClose}>
            <ClearIcon />
          </IconButton>
        </Grid>
        <Grid item className={classes.header}>
          <Typography variant='h5'>{title}</Typography>
        </Grid>
        <Grid item className={classes.info}>
          <Typography variant='body2' className={classes.infoText}>
            {info}
          </Typography>
        </Grid>
        {children}
      </Grid>
    </Dialog>
  )
}

InvitationModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  info: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.node])
}

InvitationModal.defaultProps = {
  open: false
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(InvitationModal)
