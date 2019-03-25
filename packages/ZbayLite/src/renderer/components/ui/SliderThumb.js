import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    width: 18,
    height: 18,
    background: '#d8d8d8',
    borderColor: '#979797',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: '50%'
  }
})

export const SliderThumb = ({ classes }) => (
  <div className={classes.root} />
)

SliderThumb.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SliderThumb)
