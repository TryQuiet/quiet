import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { Redirect } from 'react-router'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import PasswordField from '../ui/form/PasswordField'
import Icon from '../ui/Icon'
import LoadingButton from '../ui/LoadingButton'

import icon from '../../static/images/zcash/logo-lockup--circle.svg'
import Tor from '../../containers/windows/Tor'
import electronStore from '../../../shared/electronStore'

const styles = theme => ({
  paper: {
    width: '100vw',
    height: '100vh',
    padding: 20,
    WebkitAppRegion: 'drag'
  },
  icon: {
    width: 285,
    height: 67
  },
  logoContainer: {
    height: 167
  },
  passwordField: {
    width: 286
  },
  title: {
    textAlign: 'center',
    width: '100%',
    fontSize: 24,
    height: 36,
    marginBottom: 16
  },
  message: {
    height: 24
  },
  torDiv: {
    marginTop: -8
  }
})

const formSchema = Yup.object().shape({
  password: Yup.string().required('Required')
})

export const VaultUnlockerForm = ({
  classes,
  locked,
  unlocking,
  initialValues,
  onSubmit,
  newUser,
  loader,
  nodeConnected,
  done,
  setDone,
  tor
}) => {
  const isDev = process.env.NODE_ENV === 'development'
  const blockchainStatus = electronStore.get('AppStatus.blockchain.status')
  const isRescanned = electronStore.get('AppStatus.blockchain.isRescanned')
  return (
    <Formik
      onSubmit={(values, actions) => {
        onSubmit(values, actions, setDone)
      }}
      validationSchema={formSchema}
      initialValues={initialValues}
    >
      {({ isSubmitting }) => (
        <Form>
          <Grid
            container
            direction='column'
            spacing={2}
            justfy='center'
            alignItems='center'
            alignContent='center'
          >
            <Grid
              className={classes.logoContainer}
              container
              item
              xs={12}
              justify='center'
              alignItems='center'
              alignContent='center'
            >
              <Icon className={classes.icon} src={icon} />
            </Grid>
            <Grid container item xs={12} wrap='wrap' justify='center'>
              <Typography className={classes.title} variant='body1' gutterBottom>
                Log in
              </Typography>
            </Grid>
            <Grid container item justify='center'>
              <PasswordField
                name='password'
                className={classes.passwordField}
                label='Enter Password'
                fullWidth
              />
            </Grid>
            <Grid container item justify='center'>
              <LoadingButton
                type='submit'
                variant='contained'
                size='large'
                color='primary'
                margin='normal'
                text='Login'
                fullWidth
                disabled={
                  isSubmitting ||
                  unlocking ||
                  (tor.enabled === true && tor.status !== 'stable') ||
                  !done ||
                  tor.status === 'loading'
                }
                inProgress={isSubmitting || unlocking || !done || tor.status === 'loading'}
              />
            </Grid>
            {locked && (
              <Grid item className={classes.torDiv}>
                <Tor />
              </Grid>
            )}
            <Grid item className={classes.message}>
              <Typography variant='body2'>{loader.loading && loader.message}</Typography>
              {!nodeConnected && !done && (
                <Grid item>
                  <Typography variant='body2'>{`Connecting to Zcash network`}</Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
          {!isDev && !locked && !loader.loading && (blockchainStatus !== 'SUCCESS' || !isRescanned) && (
            <Redirect to='/zcashNode' />
          )}
          {!locked && !loader.loading && nodeConnected && (newUser ? true : done) && (
            <Redirect to='/zcashNode' />
          )}
        </Form>
      )}
    </Formik>
  )
}
VaultUnlockerForm.propTypes = {
  classes: PropTypes.object.isRequired,
  locked: PropTypes.bool.isRequired,
  unlocking: PropTypes.bool.isRequired,
  newUser: PropTypes.bool.isRequired,
  done: PropTypes.bool.isRequired,
  nodeConnected: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loader: PropTypes.object.isRequired,
  initialValue: PropTypes.shape({
    password: PropTypes.string.isRequired
  })
}
VaultUnlockerForm.defaultProps = {
  initialValues: {
    password: ''
  },
  unlocking: false,
  locked: true
}

export default withStyles(styles)(VaultUnlockerForm)
