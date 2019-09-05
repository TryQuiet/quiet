import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import NodePanel from '../../../containers/widgets/node/NodePanel'
import IdentityPanel from '../../../containers/ui/IdentityPanel'
import WalletPanel from '../../../containers/widgets/walletPanel/WalletPanel'
import ChannelsPanel from '../../../containers/widgets/channels/ChannelsPanel'
import DirectMessagesPanel from '../../../containers/widgets/channels/DirectMessagesPanel'

const styles = theme => ({
  root: {
    minHeight: '100%',
    width: '350px',
    background: '#fff',
    borderRight: 'solid #e8e8e8 1px',
    paddingBottom: '55px',
    position: 'relative',
    backgroundImage: 'linear-gradient(-44deg, #521576 6%, #E42656 100%)',
    color: 'white'
  },
  gutterBottom: {
    marginBottom: theme.spacing(4)
  },
  statusBar: {
    position: 'absolute',
    zIndex: 1000,
    bottom: 0,
    left: 0,
    right: 0
  }
})

// TODO: add direct messages panel
const Sidebar = ({ classes }) => (
  <Grid container direction='column' className={classes.root}>
    <IdentityPanel />
    <WalletPanel />
    <ChannelsPanel />
    <DirectMessagesPanel />
    <NodePanel hexColor='#cca92c' className={classes.statusBar} />
  </Grid>
)

Sidebar.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Sidebar)
