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
    marginRight: 4
  },
  value: {
    color: theme.palette.primary.main
  },
  iconWhite: {
    fill: 'rgb(255,255,255,0.5)',
    marginRight: 4
  },
  valueWhite: {
    color: 'rgb(255,255,255,0.5)'
  }
})

export const ZecBalance = ({ classes, value, size, style }) => {
  return (
    <Grid container alignItems='center'>
      <ZcashIcon size={size} className={style === 'white' ? classes.iconWhite : classes.icon} />
      <Typography
        variant='caption'
        style={{ fontSize: `${size / 20}rem`, marginTop: size / 7 }}
        className={style === 'white' ? classes.valueWhite : classes.value}
      >
        {R.isNil(value) ? '-' : new BigNumber(value).toFormat(6)}
      </Typography>
    </Grid>
  )
}

ZecBalance.propTypes = {
  classes: PropTypes.object.isRequired,
  size: PropTypes.number.isRequired,
  value: PropTypes.instanceOf(BigNumber),
  style: PropTypes.string
}
ZecBalance.defaultProps = {
  size: 14
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ZecBalance)
