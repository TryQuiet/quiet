import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Grow from '@material-ui/core/Grow'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

import InfoIcon from '@material-ui/icons/InfoOutlined'

import Tooltip from '../../../ui/Tooltip'
import UsdBalance from '../UsdBalance'
import ZecBalance from '../ZecBalance'

const styles = theme => ({
  title: {
    fontSize: '0.71rem'
  },
  lockedTitle: {
    marginLeft: theme.spacing.unit * 1.25,
    fontSize: '0.71rem'
  },
  lockedRoot: {
    height: '100%'
  },
  icon: {
    color: theme.typography.caption.color,
    fontSize: 16,
    marginLeft: theme.spacing.unit * 0.5
  }
})

const TOOLTIP_MESSAGE = 'Because of the network\'s consensus requirements funds may be locked while your message is being broadcasted.'

// TODO: no need for align and title
export const ZcashBalance = ({ classes, usdBalance, zecBalance, usdLocked, zecLocked }) => (
  <Grid container direction='row' justify='flex-start' alignItems='stretch' spacing={8} >
    <Grid item>
      <Grid container direction='column'>
        <Typography variant='body2' className={classes.title}>
          Available
        </Typography>
        <Grid item>
          <UsdBalance value={usdBalance} />
        </Grid>
        <Grid item className={classes.zec} >
          <ZecBalance value={zecBalance} />
        </Grid>
      </Grid>
    </Grid>
    <Grow in={!usdLocked.isZero() || !zecLocked.isZero()}>
      <Grid item>
        <Grid
          container
          direction='column'
          justify='space-between'
          alignItems='flex-start'
          className={classes.lockedRoot}
        >
          <Grid item container alignItems='center'>
            <Typography variant='caption' inline className={classes.lockedTitle}>
              Locked
            </Typography>
            <Tooltip
              title={TOOLTIP_MESSAGE}
              placement='bottom'
            >
              <InfoIcon className={classes.icon} />
            </Tooltip>
          </Grid>
          <Typography variant='caption'>
            + {usdLocked.toFormat(2)}
          </Typography>
          <Grid item className={classes.zec} >
            <Typography variant='caption'>
              + {zecLocked.toFormat(6)}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grow>
  </Grid>
)

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
  React.memo,
  withStyles(styles)
)(ZcashBalance)
