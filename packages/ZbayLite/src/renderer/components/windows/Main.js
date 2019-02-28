import React from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router-dom'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper'
import Sidebar from '../ui/Sidebar'
import Home from '../pages/Home'

const styles = {
  gridRoot: {
    'min-height': '100vh'
  }
}

export const Main = ({ match, classes }) => (
  <WindowWrapper>
    <Grid container direction='row' className={classes.gridRoot}>
      <Grid item>
        <Sidebar />
      </Grid>
      <Grid item xs>
        <Route exact path={match.url} component={Home} />
      </Grid>
    </Grid>
  </WindowWrapper>
)

Main.propTypes = {
  classes: PropTypes.object.isRequired,
  match: PropTypes.shape({
    url: PropTypes.string.isRequired
  }).isRequired
}

export default withStyles(styles)(Main)
