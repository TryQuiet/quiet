import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

import WindowWrapper from '../ui/WindowWrapper'
import SpinnerLoader from '../ui/SpinnerLoader'
const styles = theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export const Loading = ({ classes, message }) => (
  <WindowWrapper className={classes.root}>
    <SpinnerLoader size={150} message={message} />
  </WindowWrapper>
)

Loading.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Loading)
