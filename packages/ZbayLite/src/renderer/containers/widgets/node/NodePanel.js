import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodePanelComponent from '../../../components/widgets/node/NodePanel'

export const NodePanel = () => {
  const [expanded, setExpanded] = React.useState(false)
  return <NodePanelComponent expanded={expanded} setExpanded={setExpanded} />
}

export default R.compose(
  React.memo,
  connect(null)
)(NodePanel)
