import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodePanelComponent from '../../../components/widgets/node/NodePanel'
import nodeSelectors from '../../../store/selectors/node'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  status: nodeSelectors.status(state),
  freeUtxos: identitySelectors.freeUtxos(state)
})

export const NodePanel = ({ status, freeUtxos }) => {
  const [expanded, setExpanded] = React.useState(false)
  return (
    <NodePanelComponent
      expanded={expanded}
      status={status}
      setExpanded={setExpanded}
      freeUtxos={freeUtxos}
    />
  )
}

export default R.compose(React.memo, connect(mapStateToProps))(NodePanel)
