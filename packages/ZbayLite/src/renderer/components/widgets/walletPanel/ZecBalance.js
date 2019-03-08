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
    marginTop: '2px',
    marginRight: '4px'
  },
  value: {
    color: theme.palette.primary.main
  }
})

export const ZecBalance = ({ classes, value }) => (
  <Grid container>
    <ZcashIcon size={14} className={classes.icon} />
    <Typography variant='caption' className={classes.value}>
      {R.isNil(value) ? '-' : value.toFormat(6)}
    </Typography>
  </Grid>
)

ZecBalance.propTypes = {
  classes: PropTypes.object.isRequired,
  value: PropTypes.instanceOf(BigNumber)
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ZecBalance)
