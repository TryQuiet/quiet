import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import NodePanel from '../../../containers/widgets/node/NodePanel'
import IdentityPanel from '../../../containers/ui/IdentityPanel'
import WalletPanel from '../walletPanel/WalletPanel'
import ChannelsPanel from '../channels/ChannelsPanel'
import DirectMessagesPanel from '../channels/DirectMessagesPanel'

const styles = theme => ({
  root: {
    minHeight: '100%',
    width: '300px',
    background: '#fff',
    borderRight: 'solid #e8e8e8 1px',
    paddingBottom: '55px',
    position: 'relative'
  },
  gutterBottom: {
    marginBottom: 4 * theme.spacing.unit
  },
  statusBar: {
    position: 'absolute',
    zIndex: 1000,
    bottom: 0,
    left: 0,
    right: 0
  }
})

const channels = R.map(
  id => ({
    name: `Channel ${id}`,
    description: `This is channel about 1`,
    private: id % 2 === 0,
    unread: id % 2 === 0 ? 34 : (id % 3 === 0 ? 233 : 0),
    hash: `test-hash-1`,
    address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly' + id
  }),
  R.range(0, 15)
)

const Sidebar = ({ classes }) => (
  <Grid container direction='column' className={classes.root}>
    <IdentityPanel />
    <WalletPanel />
    <ChannelsPanel channels={channels} />
    <DirectMessagesPanel channels={channels} />
    <NodePanel hexColor='#cca92c' className={classes.statusBar} />
  </Grid>
)

Sidebar.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Sidebar)
