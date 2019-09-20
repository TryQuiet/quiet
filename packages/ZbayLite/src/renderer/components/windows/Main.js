import React from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router-dom'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper'
import Sidebar from '../widgets/sidebar/Sidebar'
import Channel from '../../containers/pages/Channel'
import DirectMessages from '../../containers/pages/DirectMessages'
import DepositMoneyModal from '../../containers/ui/DepositMoneyModal'

const styles = {
  gridRoot: {
    'min-height': '100vh',
    'min-width': '100vw'
  }
}

export const Main = ({ match, classes }) => {
  return (
    <>
      <DepositMoneyModal />
      <WindowWrapper>
        <Grid container direction='row' className={classes.gridRoot}>
          <Grid item>
            <Sidebar />
          </Grid>
          <Grid item xs>
            <Route exact path={`${match.url}/channel/:id`} component={Channel} />
            <Route
              exact
              path={`${match.url}/direct-messages/:id/:username`}
              component={DirectMessages}
            />
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

export default withStyles(styles)(Main)
