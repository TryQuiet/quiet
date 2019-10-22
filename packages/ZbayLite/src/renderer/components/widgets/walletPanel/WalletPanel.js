import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WalletPanelActions from '../../../containers/widgets/walletPanel/WalletPanelActions'
import ZcashBalance from '../../../containers/widgets/walletPanel/ZcashBalance'
import QuickActionButton from '../sidebar/QuickActionButton'

const styles = theme => ({
  root: {
    paddingLeft: 16,
    paddingRight: 16
  }
})

export const WalletPanel = ({ classes, handleInvitation }) => {
  return (
    <>
      <Grid
        item
        container
        direction='row'
        justify='space-between'
        alignItems='center'
        className={classes.root}
      >
        <ZcashBalance />
        <Grid item>
          <WalletPanelActions />
        </Grid>
      </Grid>
      <QuickActionButton text='Invite friends' action={handleInvitation} />
    </>
  )
}

WalletPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  handleInvitation: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(WalletPanel)
