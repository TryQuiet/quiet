import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

export const QuitAppDialog = ({ classes, handleClose, handleQuit, open }) => (
  <Dialog
    onClose={handleClose}
    open={open}
  >
    <DialogContent>
      <Typography variant='body2'>
        Do you really want to quit Zbay?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Grid container direction='row' spacing={8} justify='flex-end'>
        <Grid item>
          <Button
            variant='contained'
            size='small'
            color='primary'
            onClick={handleQuit}
          >
            Quit
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={handleClose}
          >
            Cancel
          </Button>
        </Grid>
      </Grid>
    </DialogActions>
  </Dialog>
)

QuitAppDialog.propTypes = {
  handleClose: PropTypes.func.isRequired,
  handleQuit: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
}

export default R.compose(
  React.memo
)(QuitAppDialog)
