import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import WalletPanelActions from '../../../containers/widgets/walletPanel/WalletPanelActions'
import ZcashBalance from '../../../containers/widgets/walletPanel/ZcashBalance'

const styles = theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  actions: {
    marginTop: theme.spacing(2)
  },
  zec: {
    paddingTop: theme.spacing(2)
  }
})

export const WalletPanel = ({ classes }) => {
  return (
    <React.Fragment>
      <Grid item container direction='column' className={classes.root}>
        <Grid item container direction='row' justify='space-between' alignItems='center'>
          <ZcashBalance />
        </Grid>
        <Grid item className={classes.actions}>
          <WalletPanelActions />
        </Grid>
      </Grid>
    </React.Fragment>
  )
}

WalletPanel.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(withStyles(styles))(WalletPanel)
