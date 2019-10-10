import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Grow from '@material-ui/core/Grow'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

import InfoIcon from '@material-ui/icons/InfoOutlined'

import { SpinnerLoader } from '../../../ui/SpinnerLoader'
import UsdBalance from '../UsdBalance'
import ZecBalance from '../ZecBalance'

const styles = theme => ({
  title: {
    fontSize: 11
  },
  lockedTitle: {
    fontSize: '0.85rem',
    color: theme.palette.colors.white
  },
  lockedRoot: {
    height: '100%',
    backgroundColor: 'rgb(0,0,0,0.2)',
    borderRadius: 5,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1)
  },
  icon: {
    marginTop: 5,
    color: theme.typography.caption.color,
    fontSize: 25
  },
  alignHorizontal: {
    margin: 0,
    textAlign: 'center'
  },
  spinner: {
    color: theme.palette.colors.white
  },
  usd: {
    fontWeight: 700
  }
})

export const ZcashBalance = ({ classes, usdBalance, zecBalance, usdLocked, zecLocked }) => {
  return (
    <Grid container direction='row' justify='flex-start' alignItems='stretch' spacing={1}>
      <Grid item xs={12}>
        <Typography variant='body2' className={classes.title}>
          Available
        </Typography>
        <Grid container justify='space-between' align='center' direction='row'>
          <Grid item>
            <UsdBalance value={usdBalance} />
          </Grid>
          <Grid item className={classes.zec}>
            <ZecBalance size={16} value={zecBalance} style='white' />
          </Grid>
        </Grid>
      </Grid>
      {(!usdLocked.isZero() || !zecLocked.isZero()) && (
        <Grow in={!usdLocked.isZero() || !zecLocked.isZero()}>
          <Grid item xs={12}>
            <Grid
              container
              direction='row'
              justify='space-evenly'
              alignItems='center'
              className={classes.lockedRoot}
              spacing={0}
            >
              <Grid item xs={2} className={classes.alignHorizontal}>
                <SpinnerLoader classes={classes} size={30} />
              </Grid>
              <Grid item xs={7} container alignItems='center'>
                <Grid item xs={12}>
                  <Typography variant='caption' display='inline' className={classes.lockedTitle}>
                    Pending <span className={classes.usd}>${usdLocked.toFormat(2)}</span> USD
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='caption'>{zecLocked.toFormat(6)} ZEC</Typography>
                </Grid>
              </Grid>
              <Grid item xs={2} className={classes.alignHorizontal}>
                <InfoIcon className={classes.icon} />
              </Grid>
            </Grid>
          </Grid>
        </Grow>
      )}
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

export default R.compose(
  withStyles(styles)
)(ZcashBalance)
