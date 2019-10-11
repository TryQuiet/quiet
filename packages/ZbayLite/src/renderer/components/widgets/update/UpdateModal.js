import React from 'react'
import PropTypes from 'prop-types'

import AppBar from '@material-ui/core/AppBar'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal'

const styles = theme => ({
  root: {
    height: 200
  },
  info: {
    marginBottom: 5
  },
  button: {
    height: 55,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  }
})

export const UpdateModal = ({ classes, open, handleClose, handleUpdate, rejectUpdate }) => {
  return (
    <Modal open={open} handleClose={handleClose} title='Update available'>
      <AppBar position='static' color='default'>
        <Grid container direction='column' className={classes.root} alignItems='center' justify='center'>
          <Grid className={classes.info} container spacing={8} justify='center'>
            <Grid item>
              <Typography variant='subtitle2'>New update for Zbay is available, do you want to proceed ?</Typography>
            </Grid>
          </Grid>
          <Grid container spacing={8} justify='center'>
            <Grid item xs={4}>
              <Button
                variant='contained'
                size='large'
                color='primary'
                type='submit'
                onClick={handleUpdate}
                fullWidth
                className={classes.button}
              >
        Yes
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant='contained'
                size='large'
                color='primary'
                type='submit'
                fullWidth
                onClick={rejectUpdate}
                className={classes.button}
              >
        No
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </AppBar>
    </Modal>
  )
}

UpdateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleUpdate: PropTypes.func.isRequired,
  rejectUpdate: PropTypes.func.isRequired
}

export default withStyles(styles)(UpdateModal)
