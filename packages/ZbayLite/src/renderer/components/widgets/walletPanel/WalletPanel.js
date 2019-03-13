import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WalletPanelActions from '../../../containers/widgets/walletPanel/WalletPanelActions'
import UsdBalance from '../../../containers/widgets/walletPanel/UsdBalance'
import ZecBalance from '../../../containers/widgets/walletPanel/ZecBalance'

const styles = theme => ({
  root: {
    paddingLeft: 2 * theme.spacing.unit,
    paddingTop: 2.5 * theme.spacing.unit,
    paddingRight: 4 * theme.spacing.unit,
    paddingBottom: theme.spacing.unit
  },
  actions: {
    marginTop: 2 * theme.spacing.unit
  },
  zec: {
    paddingTop: 2 * theme.spacing.unit
  }
})

export const WalletPanel = ({ classes }) => (
  <Grid item container direction='column' className={classes.root}>
    <Grid item>
      <Grid container direction='row' justify='space-between' alignItems='center' >
        <Grid item>
          <UsdBalance />
        </Grid>
        <Grid item className={classes.zec}>
          <ZecBalance />
        </Grid>
      </Grid>
    </Grid>
    <Grid item className={classes.actions}>
      <WalletPanelActions />
    </Grid>
  </Grid>
)

WalletPanel.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(WalletPanel)
