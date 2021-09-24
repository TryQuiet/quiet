import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { Redirect } from 'react-router'
import classNames from 'classnames'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import Icon from '../ui/Icon/Icon'
import LoadingButton from '../ui/LoadingButton/LoadingButton'

import icon from '../../static/images/zcash/logo-lockup--circle.svg'

const styles = theme => ({
  paper: {
    width: '100vw',
    height: '100vh',
    padding: 20,
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
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
    width: 456,
    fontSize: 14,
    color: theme.palette.colors.black30,
    lineHeight: '20px'
  },
  torDiv: {
    marginTop: -8
  },
  status: {
    width: '100%',
    textAlign: 'center'
  },
  progressBar: {
    backgroundColor: theme.palette.colors.linkBlue
  },
  rootBar: {
    width: 250
  },
  moreOptionsButton: {
    color: theme.palette.colors.lushSky
  },
  carouselContainer: {
    width: 450,
    height: 100
  },
  existingUser: {
    fontSize: 24,
    lineHeight: '36px',
    color: theme.palette.colors.trueBlack,
    margin: 0
  }
})

const formSchema = Yup.object().shape({
  password: Yup.string().required('Required')
})

export const VaultUnlockerForm = ({
  classes,
  onSubmit,
  loader,
  isNewUser,
  mainChannelLoaded
}) => {
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production'
  const [done, setDone] = useState(true)
  const [syncingStart, setSyncingStart] = useState(false)

  React.useEffect(() => {
    setSyncingStart(true)
    onSubmit(setDone)
  }, [])
  return (
    <Formik
      onSubmit={() => { }}
      validationSchema={isDev ? null : formSchema}
    >
      {({ isSubmitting }) => (
        <Form>
          <Grid
            container
            direction='column'
            spacing={!isNewUser ? 4 : 6}
            justfy='center'
            alignItems='center'
            alignContent='center'>
            <Grid
              className={classes.logoContainer}
              container
              item
              xs={12}
              justify='center'
              alignItems='center'
              alignContent='center'>
              <Icon className={classes.icon} src={icon} />
            </Grid>
            <Grid container item xs={12} wrap='wrap' justify='center'>
              <Typography
                className={classNames({
                  [classes.title]: true,
                  [classes.existingUser]: !isNewUser
                })}
                variant='body1'
                gutterBottom>
                {!isNewUser ? 'Welcome Back' : 'Welcome to Zbay!'}
              </Typography>
            </Grid>

            <Grid container item justify='center'>
              <LoadingButton
                type='submit'
                variant='contained'
                size='large'
                color='primary'
                margin='normal'
                text={!isNewUser ? 'Sign in' : 'Connect Now'}
                fullWidth
                disabled={!done || syncingStart}
                inProgress={!done || syncingStart}
              />
            </Grid>

            <Grid item container justify='center' alignItems='center'>
              <Typography variant='body2' className={classes.status}>
                {loader.message}
              </Typography>
            </Grid>
          </Grid>
          { mainChannelLoaded && (
            <Redirect to='/main/channel/general' />
          )}
        </Form>
      )}
    </Formik>
  )
}
VaultUnlockerForm.propTypes = {
  classes: PropTypes.object.isRequired,
  isLogIn: PropTypes.bool.isRequired,
  unlocking: PropTypes.bool.isRequired,
  exists: PropTypes.bool.isRequired,
  done: PropTypes.bool,
  nodeConnected: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loader: PropTypes.object.isRequired,
  isNewUser: PropTypes.bool.isRequired,
  initialValue: PropTypes.shape({
    password: PropTypes.string.isRequired
  }),
  mainChannelLoaded: PropTypes.bool.isRequired
}
VaultUnlockerForm.defaultProps = {
  initialValues: {
    password: ''
  },
  unlocking: false,
  locked: true,
  mainChannelLoaded: false
}

export default withStyles(styles)(VaultUnlockerForm)
