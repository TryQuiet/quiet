import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { Redirect } from 'react-router'
import BigNumber from 'bignumber.js'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import LinearProgress from '@material-ui/core/LinearProgress'
import { withStyles } from '@material-ui/core/styles'

import PasswordField from '../ui/form/PasswordField'
import Icon from '../ui/Icon'
import LoadingButton from '../ui/LoadingButton'

import icon from '../../static/images/zcash/logo-lockup--circle.svg'
import Tor from '../../containers/windows/Tor'
import electronStore from '../../../shared/electronStore'
import config from '../../../main/config'

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
    height: 24,
    marginBottom: 50
  },
  torDiv: {
    marginTop: -8
  },
  status: {
    paddingTop: 8,
    width: '100%',
    fontSize: '1rem',
    color: theme.palette.colors.darkGray,
    textAlign: 'center'
  },
  progressBar: {
    backgroundColor: theme.palette.colors.linkBlue
  },
  rootBar: {
    width: 250
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
  loader,
  nodeConnected,
  done,
  setDone,
  tor,
  node,
  isLogIn
}) => {
  const isDev = process.env.NODE_ENV === 'development'
  const blockchainStatus = electronStore.get('AppStatus.blockchain.status')
  const isRescanned = electronStore.get('AppStatus.blockchain.isRescanned')
  const lastBlock = node.latestBlock.isEqualTo(0) ? 999999 : node.latestBlock
  const isBlockchainFromExternalSouce = electronStore.get('isBlockchainFromExternalSource') && blockchainStatus !== config.BLOCKCHAIN_STATUSES.SUCCESS
  const isSynced = (!node.latestBlock.isEqualTo(0) && node.latestBlock.minus(node.currentBlock).lt(10)) && new BigNumber(node.latestBlock).gt(755000)
  const sync = parseFloat((node.currentBlock.div(lastBlock).times(100)).toString()).toFixed(2)
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
                  tor.status === 'loading' ||
                  (!isSynced && isLogIn)
                }
                inProgress={isSubmitting || unlocking || !done || tor.status === 'loading' || (!isSynced && isLogIn)}
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
          {(!isSynced && isLogIn) && (
            <Fragment>
              <Grid item container justify='center' alignItems='center'>
                <LinearProgress variant={'determinate'} classes={{ root: classes.rootBar, barColorPrimary: classes.progressBar }} value={sync} />
              </Grid>
              <Grid item container justify='center' alignItems='center'>
                <Typography variant='caption' className={classes.status}>
                  {`Syncing (${node.currentBlock}/${lastBlock})`}
                </Typography>
              </Grid>
            </Fragment>
          )}
          {!isDev && !isBlockchainFromExternalSouce && !locked && !loader.loading && (blockchainStatus !== 'SUCCESS' || !isRescanned) && (
            <Redirect to='/zcashNode' />
          )}
          {!locked && !loader.loading && nodeConnected && done && isSynced && (
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
