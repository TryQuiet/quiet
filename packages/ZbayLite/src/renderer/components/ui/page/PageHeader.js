import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

const styles = (theme) => ({
  root: {
    background: theme.palette.colors.white,
    order: -1,
    zIndex: 10,
    WebkitAppRegion: 'drag'
  }
})

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
