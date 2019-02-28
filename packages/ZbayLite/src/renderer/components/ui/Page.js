import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

import PageHeader from './PageHeader'

const styles = {
  root: {
  }
}

export const Page = ({ classes, children }) => (
  <div className={classes.root}>
    <PageHeader />
    {children}
  </div>
)

PageHeader.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(PageHeader)
