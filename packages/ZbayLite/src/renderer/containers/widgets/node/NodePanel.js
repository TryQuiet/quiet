import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodePanelComponent from '../../../components/widgets/node/NodePanel'

export const NodePanel = ({ className }) => {
  return <NodePanelComponent className={className} />
}

export default R.compose(
  React.memo,
  connect(null)
)(NodePanel)
