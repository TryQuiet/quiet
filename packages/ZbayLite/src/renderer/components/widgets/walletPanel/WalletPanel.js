import React from 'react'
import BigNumber from 'bignumber.js'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WalletPanelActions from '../../../containers/widgets/walletPanel/WalletPanelActions'
import ZcashBalance from '../../../containers/widgets/walletPanel/ZcashBalance'
import TopUpModal from '../../../containers/widgets/walletPanel/TopUpModal'

const styles = theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingTop: theme.spacing(2.5),
    paddingRight: theme.spacing(4),
    paddingBottom: theme.spacing(1)
  },
  actions: {
    marginTop: theme.spacing(2)
  },
  zec: {
    paddingTop: theme.spacing(2)
  }
})

export const WalletPanel = ({
  classes,
  topUpOpen,
  handleReceive,
  handleCloseTopUp
}) => {
  return (
    <React.Fragment>
      <Grid item container direction='column' className={classes.root}>
        <Grid item container direction='row' justify='space-between' alignItems='center' >
          <ZcashBalance />
        </Grid>
        <Grid item className={classes.actions}>
          <WalletPanelActions onReceive={handleReceive} />
        </Grid>
      </Grid>
      <TopUpModal open={topUpOpen} handleClose={handleCloseTopUp} />
    </React.Fragment>
  )
}

WalletPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  topUpOpen: PropTypes.bool.isRequired,
  handleReceive: PropTypes.func.isRequired,
  handleCloseTopUp: PropTypes.func.isRequired
}

WalletPanel.defaultProps = {
  topUpOpen: false,
  transparentBalance: new BigNumber(0)
}

export default R.compose(
  withStyles(styles)
)(WalletPanel)
