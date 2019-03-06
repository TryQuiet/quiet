import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Typography from '@material-ui/core/Typography'

import NodePanelField from '../../../components/widgets/node/NodePanelField'

import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  connections: nodeSelectors.connections(state)
})

export const NodePanelConnectionsField = ({ connections }) => (
  <NodePanelField name='Connections'>
    <Typography inline variant='overline'>
      {connections}
    </Typography>
  </NodePanelField>
)

NodePanelConnectionsField.propTypes = {
  connections: PropTypes.number.isRequired
}

export default connect(mapStateToProps)(NodePanelConnectionsField)
