import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Tooltip from '../../../ui/Tooltip'

const styles = theme => ({
  zecBalance: {
    opacity: 0.7
  },
  usdBalance: {
    opacity: 0.5,
    color: theme.palette.colors.white
  },
  pending: {
    marginLeft: 8,
    opacity: 0.5,
    color: theme.palette.colors.white,
    '&:hover': {
      opacity: 1
    }
  },
  tooltip: {
    maxWidth: 180
  }
})

export const ZcashBalance = ({ classes, usdBalance, zecBalance, usdLocked, zecLocked }) => {
  return (
    <Grid container align='flex-start' direction='column' spacing={0}>
      <Grid item>
        <Typography display='inline' variant='body2' className={classes.zecBalance}>
          {zecBalance.toString().substring(0, 5)} ZEC
        </Typography>
        {(!usdLocked.isZero() || !zecLocked.isZero()) && (
          <Tooltip
            title='Some funds are unavailable until pending transactions complete.'
            className={classes.tooltip}
            placement='bottom'
          >
            <Typography display='inline' variant='caption' className={classes.pending}>
              Pending...
            </Typography>
          </Tooltip>
        )}
      </Grid>
      <Grid item>
        <Typography variant='caption' className={classes.usdBalance}>
          $
          {usdBalance.gt(100) ? usdBalance.toFixed(0).toString() : usdBalance.toFixed(2).toString()}{' '}
          USD
        </Typography>
      </Grid>
    </Grid>
  )
}
ZcashBalance.propTypes = {
  classes: PropTypes.object.isRequired,
  usdBalance: PropTypes.instanceOf(BigNumber),
  zecBalance: PropTypes.instanceOf(BigNumber),
  usdLocked: PropTypes.instanceOf(BigNumber),
  zecLocked: PropTypes.instanceOf(BigNumber)
}

ZcashBalance.defaultProps = {
  usdBalance: new BigNumber(0),
  zecBalance: new BigNumber(0),
  usdLocked: new BigNumber(0),
  zecLocked: new BigNumber(0)
}

export default R.compose(withStyles(styles))(ZcashBalance)
