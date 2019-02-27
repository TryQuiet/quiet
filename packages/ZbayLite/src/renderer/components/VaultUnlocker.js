import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import LockOpenIcon from '@material-ui/icons/LockOpen'

import Snackbar from './ui/Snackbar'
import PasswordInput from './ui/PasswordInput'
import ProgressFab from './ui/ProgressFab'

const styles = theme => ({
  paper: {
    padding: '20px'
  },
  fab: {
    'margin-top': 2 * theme.spacing.unit,
    'margin-left': 2 * theme.spacing.unit
  }
})

export const VaultUnlocker = ({
  classes,
  onClick,
  unlocking,
  locked,
  error,
  password,
  passwordVisible,
  onCloseSnackbar,
  handleSetPassword,
  handleTogglePassword
}) => (
  <Paper className={classes.paper}>
    <Grid container>
      <Grid item>
        <PasswordInput
          label='Master password'
          passwordVisible={passwordVisible}
          password={password}
          handleSetPassword={handleSetPassword}
          handleTogglePassword={handleTogglePassword}
        />
      </Grid>
      <Grid item>
        <ProgressFab
          label='Unlock'
          className={classes.fab}
          onClick={onClick}
          loading={unlocking}
          success={!locked}
          disabled={!locked}
        >
          <LockOpenIcon />
        </ProgressFab>
      </Grid>
    </Grid>
    <Snackbar
      variant='error'
      message={error}
      open={error.length > 0}
      onClose={onCloseSnackbar}
    />
  </Paper>
)

VaultUnlocker.propTypes = {
  classes: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  unlocking: PropTypes.bool.isRequired,
  locked: PropTypes.bool.isRequired,
  error: PropTypes.string,
  password: PropTypes.string.isRequired,
  passwordVisible: PropTypes.bool.isRequired,
  onCloseSnackbar: PropTypes.func.isRequired,
  handleSetPassword: PropTypes.func.isRequired,
  handleTogglePassword: PropTypes.func.isRequired
}

VaultUnlocker.defaultProps = {
  error: '',
  unlocking: false,
  locked: true,
  passwordVisible: false
}

export default React.memo(withStyles(styles)(VaultUnlocker))
