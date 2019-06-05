import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WalletPanelActions from '../../../containers/widgets/walletPanel/WalletPanelActions'
import UsdBalance from '../../../containers/widgets/walletPanel/UsdBalance'
import ZecBalance from '../../../containers/widgets/walletPanel/ZecBalance'
import TopUpModal from '../../../containers/widgets/walletPanel/TopUpModal'

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

export const WalletPanel = ({ classes, handleReceive }) => {
  const [topUpOpen, setTopUpOpen] = useState(false)

  return (
    <React.Fragment>
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
          <WalletPanelActions onReceive={() => setTopUpOpen(true)} />
        </Grid>
      </Grid>
      <TopUpModal open={topUpOpen} handleClose={() => setTopUpOpen(false)} />
    </React.Fragment>
  )
}

WalletPanel.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(WalletPanel)
