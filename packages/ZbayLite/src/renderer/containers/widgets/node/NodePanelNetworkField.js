import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Typography from '@material-ui/core/Typography'

import NodePanelField from '../../../components/widgets/node/NodePanelField'

import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  network: nodeSelectors.network(state)
})

export const NodePanelNetworkField = ({ network }) => (
  <NodePanelField name='Network'>
    <Typography inline variant='overline'>
      {network || '?'}
    </Typography>
  </NodePanelField>
)

NodePanelNetworkField.propTypes = {
  network: PropTypes.oneOf(['mainnet', 'testnet'])
}

export default connect(mapStateToProps)(NodePanelNetworkField)
