import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import ZcashIcon from '../../ui/ZcashIcon'

const styles = theme => ({
  icon: {
    fill: theme.palette.primary.main,
    marginRight: '4px'
  },
  value: {
    color: theme.palette.primary.main
  }
})

export const ZecBalance = ({ classes, value, size }) => {
  return (
    <Grid container alignItems='center'>
      <ZcashIcon size={size} className={classes.icon} />
      <Typography
        variant='caption'
        style={{ fontSize: `${size / 20}rem`, marginTop: size / 7 }}
        className={classes.value}
      >
        {R.isNil(value) ? '-' : value.toFormat(6)}
      </Typography>
    </Grid>
  )
}

ZecBalance.propTypes = {
  classes: PropTypes.object.isRequired,
  size: PropTypes.number.isRequired,
  value: PropTypes.instanceOf(BigNumber)
}
ZecBalance.defaultProps = {
  size: 14
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ZecBalance)
