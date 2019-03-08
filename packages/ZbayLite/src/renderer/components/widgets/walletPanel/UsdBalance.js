import React from 'react'
import BigNumber from 'bignumber.js'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

const styles = {
  value: {
    fontSize: '20px'
  },
  title: {
    fontSize: '0.71rem'
  }
}

export const UsdBalance = ({ classes, value }) => (
  <Grid container direction='column'>
    <Typography variant='body2' className={classes.title}>
      Available
    </Typography>
    <Typography variant='h5' className={classes.value}>
      ${R.isNil(value) ? '-' : value.toFormat(2)} USD
    </Typography>
  </Grid>
)

UsdBalance.propTypes = {
  classes: PropTypes.object.isRequired,
  value: PropTypes.instanceOf(BigNumber)
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(UsdBalance)
