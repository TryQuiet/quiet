import React from 'react'
import BigNumber from 'bignumber.js'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import NodePanelField from '../../../components/widgets/node/NodePanelField'

import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  connections: nodeSelectors.connections(state)
})

export const NodePanelConnectionsField = ({ connections }) => (
  <NodePanelField name='Connections' value={connections.toString()} />
)

NodePanelConnectionsField.propTypes = {
  connections: PropTypes.instanceOf(BigNumber).isRequired
}

export default connect(mapStateToProps)(NodePanelConnectionsField)
