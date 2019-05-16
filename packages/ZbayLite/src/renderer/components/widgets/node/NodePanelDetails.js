import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

// import NodePanelActions from '../../../containers/widgets/node/NodePanelActions'
import NodePanelBlocksField from '../../../containers/widgets/node/NodePanelBlocksField'
import NodePanelConnectionsField from '../../../containers/widgets/node/NodePanelConnectionsField'
import NodePanelNetworkField from '../../../containers/widgets/node/NodePanelNetworkField'
// import NodePanelUptimeField from '../../../containers/widgets/node/NodePanelUptimeField'

const styles = theme => ({
  details: {
    paddingLeft: 2 * theme.spacing.unit,
    paddingRight: 2.5 * theme.spacing.unit
  }
})

// TODO: add actions
// TODO: add uptime
export const NodePanelDetails = ({ classes }) => (
  <Grid container direction='column'>
    <Grid container direction='column' className={classes.details}>
      <NodePanelNetworkField />
      <NodePanelBlocksField />
      <NodePanelConnectionsField />
      {/* <NodePanelUptimeField /> */}
    </Grid>
    {/* <NodePanelActions /> */}
  </Grid>
)

NodePanelDetails.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(NodePanelDetails)
