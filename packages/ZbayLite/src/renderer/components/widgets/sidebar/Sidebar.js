import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import NodePanel from '../node/NodePanel'
import IdentityPanel from '../../../containers/ui/IdentityPanel'
import WalletPanel from '../walletPanel/WalletPanel'
import SidebarHeader from '../../ui/SidebarHeader'

const styles = {
  root: {
    minHeight: '100%',
    width: '300px',
    background: '#fff',
    borderRight: 'solid #e8e8e8 1px'
  },
  node: {
  }
}

const Sidebar = ({ classes }) => (
  <Grid container direction='column' justify='space-between' className={classes.root}>
    <Grid item>
      <Grid container direction='column'>
        <Grid item>
          <IdentityPanel />
        </Grid>
        <Grid item>
          <WalletPanel />
        </Grid>
        <Grid item>
          <SidebarHeader title='Channels' />
        </Grid>
      </Grid>
    </Grid>
    <Grid item>
      <Grid container direction='column'>
        <Grid item>
          <NodePanel hexColor='#cca92c' />
        </Grid>
      </Grid>
    </Grid>
  </Grid>
)

Sidebar.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Sidebar)
