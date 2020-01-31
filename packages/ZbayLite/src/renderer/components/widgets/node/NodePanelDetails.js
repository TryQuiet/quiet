import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames'

import NodePanelBlocksField from '../../../containers/widgets/node/NodePanelBlocksField'
import NodePanelConnectionsField from '../../../containers/widgets/node/NodePanelConnectionsField'
import NodePanelNetworkField from '../../../containers/widgets/node/NodePanelNetworkField'
import NodePanelFreeUtxos from '../../../containers/widgets/node/NodePanelFreeUtxos'

const styles = theme => ({
  details: {
    padding: 16,
    paddingTop: 0
  }
})

export const NodePanelDetails = ({ classes, expanded }) => (
  <Grid container direction='column'>
    <Grid
      container
      direction='column'
      className={classNames({
        [classes.details]: true
      })}
    >
      {expanded && (
        <>
          <NodePanelNetworkField />
          <NodePanelBlocksField />
          <NodePanelConnectionsField />
          <NodePanelFreeUtxos />
        </>
      )}
    </Grid>
  </Grid>
)

NodePanelDetails.propTypes = {
  classes: PropTypes.object.isRequired,
  expanded: PropTypes.bool.isRequired
}

export default R.compose(React.memo, withStyles(styles))(NodePanelDetails)
