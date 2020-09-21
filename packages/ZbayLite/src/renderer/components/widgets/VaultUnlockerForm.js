import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { Redirect } from 'react-router'
import classNames from 'classnames'
// import BigNumber from 'bignumber.js'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import Icon from '../ui/Icon'
import LoadingButton from '../ui/LoadingButton'
import Carousel from '../widgets/Carousel'

import icon from '../../static/images/zcash/logo-lockup--circle.svg'
// import Tor from '../../containers/windows/Tor'
// import electronStore from '../../../shared/electronStore'
// import Tor from '../../containers/windows/Tor'

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
  locked,
  initialValues,
  onSubmit,
  nodeConnected,
  exists,
  isLogIn,
  latestBlock,
  currentBlock,
  isRescanning,
  loader,
  openModal,
  isNewUser,
  guideStatus,
  isInitialLoadFinished
}) => {
  const isSynced = currentBlock.plus(10).gt(latestBlock)
  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'production'
  const [done, setDone] = useState(true)
  const [syncingStart, setSyncingStart] = useState(false)
  React.useEffect(() => {
    if (isRescanning === true) {
      setSyncingStart(true)
    }
  }, [isRescanning])
  return (
    <Formik
      onSubmit={(values, actions) => {
        setSyncingStart(true)
        onSubmit(values, actions, setDone)
      }}
      validationSchema={isDev ? null : formSchema}
      initialValues={initialValues}
    >
      {({ isSubmitting }) => (
        <Form>
          <Grid
            container
            direction='column'
            spacing={!isNewUser ? 4 : 6}
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
            {syncingStart && guideStatus ? (
              <Grid className={classes.carouselContainer} container item>
                <Carousel />
              </Grid>
            ) : (
              <Grid container item xs={12} wrap='wrap' justify='center'>
                <Typography
                  className={classNames({ [classes.title]: true, [classes.existingUser]: !isNewUser })}
                  variant='body1'
                  gutterBottom
                >
                  {!isNewUser ? `Welcome Back` : `Welcome to Zbay! Connect now to start syncing.`}
                </Typography>
              </Grid>
            )}
            <Grid container item justify='center'>
              <LoadingButton
                type='submit'
                variant='contained'
                size='large'
                color='primary'
                margin='normal'
                text={!isNewUser ? 'Sign in' : 'Connect Now'}
                fullWidth
                disabled={!done || isRescanning || syncingStart}
                inProgress={!done || isRescanning || syncingStart}
              />
            </Grid>
            {/* <Grid container item justify='center'>
              {!syncingStart && (
                <Typography
                  variant='body'
                  className={classes.moreOptionsButton}
                  onClick={() => openModal()}
                >Advanced settings"</Typography>
              )}
            </Grid> */}
            {(loader.loading || isRescanning || !isSynced) && (
              <Grid item container justify='center' alignItems='center'>
                <Typography variant='body2' className={classes.status}>
                  {syncingStart && (isRescanning || !isSynced)
                    ? `Syncing ${currentBlock.toString()} / ${latestBlock.toString()}`
                    : `${loader.message}`}
                </Typography>
              </Grid>
            )}
            {/* {locked && done && !isRescanning && (
              <Grid item className={classes.torDiv}>
                <Tor />
              </Grid>
            )} */}
          </Grid>
          {nodeConnected &&
            isLogIn &&
            !isRescanning &&
            isSynced &&
            isInitialLoadFinished && <Redirect to='/main/channel/general' />}
        </Form>
      )}
    </Formik>
  )
}
VaultUnlockerForm.propTypes = {
  classes: PropTypes.object.isRequired,
  isLogIn: PropTypes.bool.isRequired,
  locked: PropTypes.bool.isRequired,
  unlocking: PropTypes.bool.isRequired,
  exists: PropTypes.bool.isRequired,
  done: PropTypes.bool.isRequired,
  nodeConnected: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loader: PropTypes.object.isRequired,
  isNewUser: PropTypes.bool.isRequired,
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
