import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router-dom'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper'
import Sidebar from '../widgets/sidebar/Sidebar'
import Channel from '../../containers/pages/Channel'
import Offer from '../../containers/pages/Offer'
import DirectMessages from '../../containers/pages/DirectMessages'
import DepositMoneyModal from '../../containers/ui/DepositMoneyModal'
import electronStore from '../../../shared/electronStore'

const styles = {
  gridRoot: {
    'min-height': '100vh',
    'min-width': '100vw',
    overflow: 'hidden'
  }
}

export const Main = ({ match, classes, disablePowerSleepMode }) => {
  useEffect(() => {
    electronStore.set('isNewUser', false)
    electronStore.set('AppStatus.blockchain.isRescanned', true)
    disablePowerSleepMode()
  }, [])
  return (
    <>
      <DepositMoneyModal />
      <WindowWrapper>
        <Grid container direction='row' className={classes.gridRoot}>
          <Grid item>
            <Sidebar />
          </Grid>
          <Grid item xs>
            <Route path={`${match.url}/channel/:id`} component={Channel} />
            <Route path={`${match.url}/direct-messages/:id/:username`} component={DirectMessages} />
            <Route path={`${match.url}/offers/:id/:address`} component={Offer} />
          </Grid>
        </Grid>
      </WindowWrapper>
    </>
  )
}

Main.propTypes = {
  classes: PropTypes.object.isRequired,
  match: PropTypes.shape({
    url: PropTypes.string.isRequired
  }).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(Main)
