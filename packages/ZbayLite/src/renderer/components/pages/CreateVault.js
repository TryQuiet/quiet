import React from 'react'
import { Redirect } from 'react-router'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'

import PageWrapper from '../ui/PageWrapper'
import Snackbar from '../ui/Snackbar'
import VaultCreator from '../../containers/VaultCreator'

const styles = {
  gridRoot: {
    'min-height': '100vh'
  },
  paper: {
    padding: '20px'
  },
  welcome: {
    width: '260px',
    'margin-right': '20px'
  },
  vault: {
    width: '260px'
  },
  button: {
    backgroundColor: '#8d8d8d',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#737373'
    }
  }
}

export const CreateVault = ({
  classes,
  inProgress,
  finished,
  inProgressMsg,
  error,
  onCloseSnackbar
}) => (
  <PageWrapper>
    <Snackbar
      variant='loading'
      message={inProgressMsg}
      open={inProgress}
      fullWidth
    />
    <Snackbar
      variant='error'
      message={error}
      open={error.length > 0}
      onClose={onCloseSnackbar}
    />
    { finished && <Redirect to='/home' />}
    <Grid container justify='center' alignItems='center' className={classes.gridRoot}>
      <Grid item>
        <Paper className={classes.paper}>
          <Grid container direction='row' justify='center' alignItems='center'>
            <Grid item className={classes.welcome}>
              <Typography variant='h4' gutterBottom>
                Hey there!
              </Typography>
              <Typography variant='body1' align='justify' gutterBottom>
                Zbay vault is not configured on this computer. In order to proceed you need to choose a password for your secure vault.
              </Typography>
            </Grid>
            <Grid item>
              <VaultCreator className={classes.vault} buttonStyles={classes.button} />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  </PageWrapper>
)

CreateVault.propTypes = {
  classes: PropTypes.object.isRequired,
  inProgress: PropTypes.bool.isRequired,
  inProgressMsg: PropTypes.string.isRequired,
  error: PropTypes.string,
  finished: PropTypes.bool.isRequired,
  onCloseSnackbar: PropTypes.func.isRequired
}

CreateVault.defaultProps = {
  inProgress: false,
  inProgressMsg: '',
  error: '',
  finished: false
}

export default withStyles(styles)(CreateVault)
