import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import NodePanelField from '../../../components/widgets/node/NodePanelField'

import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  freeUtxos: identitySelectors.freeUtxos(state)
})

export const NodePanelFreeUtxos = ({ freeUtxos }) => (
  <NodePanelField name={`FREE UTXO'S`} value={freeUtxos.toString()} />
)

NodePanelFreeUtxos.propTypes = {
  freeUtxos: PropTypes.number.isRequired
}

export default connect(mapStateToProps)(NodePanelFreeUtxos)
