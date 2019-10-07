import React from 'react'
import { connect } from 'react-redux'

import NodePanelComponent from '../../../components/widgets/node/NodePanel'

export const NodePanel = ({ className }) => {
  return <NodePanelComponent className={className} />
}

export default connect(null)(NodePanel)
