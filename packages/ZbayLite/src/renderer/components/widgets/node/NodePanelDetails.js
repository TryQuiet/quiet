import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

// import NodePanelActions from '../../../containers/widgets/node/NodePanelActions'
import NodePanelBlocksField from '../../../containers/widgets/node/NodePanelBlocksField'
import NodePanelConnectionsField from '../../../containers/widgets/node/NodePanelConnectionsField'
import NodePanelNetworkField from '../../../containers/widgets/node/NodePanelNetworkField'
// import NodePanelUptimeField from '../../../containers/widgets/node/NodePanelUptimeField'
import NodePanelField from './NodePanelField'

const styles = theme => ({
  details: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2.5)
  }
})

// TODO: add actions
// TODO: add uptime
export const NodePanelDetails = ({ classes, zbayVersion }) => (
  <Grid container direction='column'>
    <Grid container direction='column' className={classes.details}>
      <NodePanelNetworkField />
      <NodePanelBlocksField />
      <NodePanelConnectionsField />
      <NodePanelField name='Zbay version'>
        <Typography display='inline' variant='overline'>
          {zbayVersion}
        </Typography>
      </NodePanelField>
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
