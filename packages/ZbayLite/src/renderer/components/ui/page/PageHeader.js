import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import constants from './constants'

const styles = {
  root: {
    background: '#fff',
    height: constants.headerHeight,
    order: -1,
    borderBottom: 'solid #cbcbcb 2px',
    boxShadow: '0 2px 20px 0 rgba(0, 0, 0, 0.15)',
    zIndex: 10
  }
}

export const PageHeader = ({ classes, children }) => (
  <Grid item className={classes.root}>
    {children}
  </Grid>
)

PageHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired
}

export default React.memo(withStyles(styles)(PageHeader))
