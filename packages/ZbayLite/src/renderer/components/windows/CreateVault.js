import React from 'react'
import { Redirect } from 'react-router'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper'
import Snackbar from '../ui/Snackbar'
import Icon from '../ui/Icon'
import VaultCreator from '../../containers/VaultCreator'
import icon from '../../static/images/zcash/logo-lockup--circle.svg'

const styles = theme => ({
  gridRoot: {
    width: '100vw',
    minHeight: '100vh',
    WebkitAppRegion: 'drag'
  },
  paper: {
    width: '100%',
    padding: 0
  },
  welcome: {
    width: '100%',
    height: '100vh',
    marginRight: 20
  },
  vault: {
    width: '100%'
  },
  button: {
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  logoContainer: {
    height: 167
  },
  title: {
    textAlign: 'center',
    width: '100%',
    fontSize: 24,
    height: 36
  },
  caption: {
    textAlign: 'center',
    width: '100%',
    fontSize: 14,
    color: theme.palette.colors.darkGray
  },
  form: {
    marginTop: 25
  },
  icon: {
    width: 285,
    height: 67
  }
})

export const CreateVault = ({
  classes,
  inProgress,
  finished,
  inProgressMsg,
  error,
  onCloseSnackbar
}) => {
  return (
    <WindowWrapper>
      <Snackbar variant='loading' message={inProgressMsg} open={inProgress} fullWidth />
      <Snackbar variant='error' message={error} open={error.length > 0} onClose={onCloseSnackbar} />
      {finished === true && <Redirect to='/' />}
      <Grid container justify='center' alignContent='flex-start' className={classes.gridRoot}>
        <Grid container item>
          <Paper className={classes.paper}>
            <Grid
              container
              direction='row'
              justify='center'
              alignContent='flex-start'
              wrap='wrap'
              className={classes.welcome}
            >
              <Grid
                className={classes.logoContainer}
                container
                item
                xs={12}
                justify='center'
                alignItems={'center'}
              >
                <Icon className={classes.icon} src={icon} />
              </Grid>
              <Grid container item xs={12} wrap='wrap' justify='center'>
                <Typography className={classes.title} variant='h4' gutterBottom>
                  Create a password
                </Typography>
                <Typography
                  className={classes.caption}
                  variant='body1'
                  align='justify'
                  gutterBottom
                >
                  To set up the secure Zbay vault, you need to create a password.
                </Typography>
              </Grid>
              <Grid item className={classes.form}>
                <VaultCreator
                  className={classes.vault}
                  buttonStyles={classes.button}
                  inProgress={inProgress}
                  finished={finished}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </WindowWrapper>
  )
}

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
