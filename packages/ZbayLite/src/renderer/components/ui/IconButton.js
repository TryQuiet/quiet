import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import IconButtonMui from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    padding: 6,
    color: theme.typography.body1.color
  }
})

export const IconButton = ({ classes, children, ...props }) => (
  <IconButtonMui classes={{ root: classes.root }} {...props}>
    {children}
  </IconButtonMui>
)

IconButton.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(IconButton)
