import React from 'react'
import BigNumber from 'bignumber.js'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

const styles = {
  value: {
    fontSize: '20px'
  }
}

export const UsdBalance = ({ classes, value }) => (
  <Typography variant='h5' className={classes.value}>
    $ {R.isNil(value) ? '-' : value.toFormat(2)} USD
  </Typography>
)

UsdBalance.propTypes = {
  classes: PropTypes.object.isRequired,
  value: PropTypes.instanceOf(BigNumber)
}

export default R.compose(
  withStyles(styles)
)(UsdBalance)
