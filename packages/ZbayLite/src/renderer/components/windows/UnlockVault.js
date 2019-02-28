import React from 'react'
import Countdown from 'react-countdown-now'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router'

import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import WindowWrapper from '../ui/WindowWrapper'
import VaultUnlocker from '../../containers/VaultUnlocker'

const countdownRenderer = ({ completed }) => completed && <Redirect to='/main' />

const styles = theme => ({
  gridRoot: {
    'min-height': '100vh'
  }
})

export const UnlockVault = ({
  classes,
  locked
}) => {
  return (
    <WindowWrapper>
      <Grid container justify='center' alignItems='center' className={classes.gridRoot}>
        <VaultUnlocker />
      </Grid>
      { !locked && <Countdown date={Date.now() + 1000} renderer={countdownRenderer} /> }
    </WindowWrapper>
  )
}

UnlockVault.propTypes = {
  classes: PropTypes.object.isRequired,
  locked: PropTypes.bool.isRequired
}

UnlockVault.defaultProps = {
  locked: true
}

export default withStyles(styles)(UnlockVault)
