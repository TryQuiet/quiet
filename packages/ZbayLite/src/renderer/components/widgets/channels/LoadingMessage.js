import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

import SpinnerLoader from '../../ui/SpinnerLoader'

const styles = theme => ({
  spinner: {
    color: theme.palette.colors.captionPurple
  }
})

export const LoadingMessage = ({ classes }) => {
  return (
    <SpinnerLoader
      classes={{ spinner: classes.spinner }}
      size={50}
      message='Loading messages'
    />
  )
}

LoadingMessage.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(React.memo, withStyles(styles))(LoadingMessage)
