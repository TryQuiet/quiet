import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import constants from './constants'

const styles = {
  root: {
    background: '#fff',
    height: `calc(100vh - ${constants.headerHeight})`
  }
}

export const PageContent = ({ children, classes }) => (
  <Grid item className={classes.root} xs>{children}</Grid>
)

PageContent.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired
}

export default React.memo(withStyles(styles)(PageContent))
